#include "aura_protocol.h"

#include <Arduino.h>

namespace
{
using aura_protocol::Category;
using aura_protocol::ParseResult;
using aura_protocol::State;
using aura_protocol::Activity;

bool equalsIgnoreCase(const char *left, const char *right)
{
  while (*left != '\0' && *right != '\0')
  {
    char leftCharacter = *left;
    char rightCharacter = *right;
    if (leftCharacter >= 'a' && leftCharacter <= 'z') leftCharacter -= 'a' - 'A';
    if (rightCharacter >= 'a' && rightCharacter <= 'z') rightCharacter -= 'a' - 'A';
    if (leftCharacter != rightCharacter) return false;
    ++left;
    ++right;
  }
  return *left == '\0' && *right == '\0';
}

bool parseUnsigned(const char *text, uint32_t &value)
{
  if (*text == '\0') return false;
  uint32_t parsed = 0;
  for (const char *character = text; *character != '\0'; ++character)
  {
    if (*character < '0' || *character > '9') return false;
    const uint32_t digit = static_cast<uint32_t>(*character - '0');
    if (parsed > (UINT32_MAX - digit) / 10U) return false;
    parsed = parsed * 10U + digit;
  }
  value = parsed;
  return true;
}

bool validLength(const char *line, uint8_t &length)
{
  length = 0;
  while (line[length] != '\0')
  {
    if (length == aura_protocol::kMaxCommandLength) return false;
    ++length;
  }
  return true;
}

void trim(char *text)
{
  uint8_t start = 0;
  while (text[start] == ' ' || text[start] == '\t') ++start;
  if (start != 0)
  {
    uint8_t index = 0;
    do
    {
      text[index] = text[index + start];
      ++index;
    } while (text[index - 1] != '\0');
  }

  uint8_t length = 0;
  while (text[length] != '\0') ++length;
  while (length > 0 && (text[length - 1] == ' ' || text[length - 1] == '\t'))
  {
    text[--length] = '\0';
  }
}

bool split(char *line, char *tokens[5], uint8_t &count)
{
  count = 0;
  char *token = line;
  while (true)
  {
    if (count == 5) return false;
    tokens[count++] = token;
    char *separator = token;
    while (*separator != '\0' && *separator != ':') ++separator;
    if (*separator == '\0') return true;
    *separator = '\0';
    token = separator + 1;
  }
}
}

namespace aura_protocol
{
ParseResult parseLine(const char *line)
{
  ParseResult result;
  uint8_t inputLength = 0;
  if (line == nullptr || !validLength(line, inputLength)) return result;

  char copy[kMaxCommandLength + 1];
  for (uint8_t index = 0; index <= inputLength; ++index) copy[index] = line[index];
  trim(copy);

  char *tokens[5] = {};
  uint8_t tokenCount = 0;
  if (!split(copy, tokens, tokenCount) || tokenCount < 2 ||
      !equalsIgnoreCase(tokens[0], "AURA")) return result;

  if (equalsIgnoreCase(tokens[1], "STATE") || equalsIgnoreCase(tokens[1], "OPENCODE"))
  {
    if (tokenCount != 3) return result;
    if (equalsIgnoreCase(tokens[1], "OPENCODE") &&
        !equalsIgnoreCase(tokens[2], "IDLE") &&
        !equalsIgnoreCase(tokens[2], "BUSY") &&
        !equalsIgnoreCase(tokens[2], "ERROR")) return result;
    result.category = Category::State;
    if (equalsIgnoreCase(tokens[2], "IDLE")) result.state = State::Idle;
    else if (equalsIgnoreCase(tokens[2], "THINKING")) result.state = State::Thinking;
    else if (equalsIgnoreCase(tokens[2], "WORKING") || equalsIgnoreCase(tokens[2], "BUSY")) result.state = State::Working;
    else if (equalsIgnoreCase(tokens[2], "WAITING")) result.state = State::Waiting;
    else if (equalsIgnoreCase(tokens[2], "ERROR")) result.state = State::Error;
    else if (equalsIgnoreCase(tokens[2], "SUCCESS")) result.state = State::Success;
    else return ParseResult{};
    result.accepted = true;
    return result;
  }

  if (equalsIgnoreCase(tokens[1], "ACTIVITY"))
  {
    if (tokenCount != 3) return result;
    result.category = Category::Activity;
    if (equalsIgnoreCase(tokens[2], "READ")) result.activity = Activity::Read;
    else if (equalsIgnoreCase(tokens[2], "SEARCH")) result.activity = Activity::Search;
    else if (equalsIgnoreCase(tokens[2], "EDIT")) result.activity = Activity::Edit;
    else if (equalsIgnoreCase(tokens[2], "SHELL")) result.activity = Activity::Shell;
    else if (equalsIgnoreCase(tokens[2], "TEST")) result.activity = Activity::Test;
    else if (equalsIgnoreCase(tokens[2], "OTHER")) result.activity = Activity::Other;
    else return ParseResult{};
    result.accepted = true;
    return result;
  }

  if (equalsIgnoreCase(tokens[1], "ATTENTION"))
  {
    result.category = Category::Attention;
    result.accepted = tokenCount == 3 && equalsIgnoreCase(tokens[2], "PERMISSION");
    return result.accepted ? result : ParseResult{};
  }

  if (equalsIgnoreCase(tokens[1], "HEARTBEAT"))
  {
    result.category = Category::Heartbeat;
    result.accepted = tokenCount == 2;
    return result.accepted ? result : ParseResult{};
  }

  if (equalsIgnoreCase(tokens[1], "METRIC") || equalsIgnoreCase(tokens[1], "SUMMARY"))
  {
    const bool metric = equalsIgnoreCase(tokens[1], "METRIC");
    if (tokenCount != 4 || (metric && !equalsIgnoreCase(tokens[2], "ERRORS") && !equalsIgnoreCase(tokens[2], "WARNINGS")) ||
        (!metric && !equalsIgnoreCase(tokens[2], "FILES")) || !parseUnsigned(tokens[3], result.value)) return ParseResult{};
    result.category = metric ? Category::Metric : Category::Summary;
    result.accepted = true;
    return result;
  }

  if (equalsIgnoreCase(tokens[1], "PROGRESS"))
  {
    if (tokenCount != 5 || !equalsIgnoreCase(tokens[2], "TODO") ||
        !parseUnsigned(tokens[3], result.completed) || !parseUnsigned(tokens[4], result.total) ||
        result.completed > result.total) return ParseResult{};
    result.category = Category::Progress;
    result.accepted = true;
  }
  return result;
}

bool Parser::process(Stream &stream, ParseResult &result)
{
  while (stream.available() > 0)
  {
    const char character = static_cast<char>(stream.read());
    if (character == '\n')
    {
      if (discarding_)
      {
        discarding_ = false;
        length_ = 0;
        result = ParseResult{};
        return true;
      }
      else
      {
        buffer_[length_] = '\0';
        result = parseLine(buffer_);
        length_ = 0;
        return true;
      }
      continue;
    }
    if (character == '\r') continue;
    if (discarding_) continue;
    if (length_ < kMaxCommandLength)
    {
      buffer_[length_++] = character;
    }
    else
    {
      discarding_ = true;
      length_ = 0;
    }
  }
  return false;
}
}
