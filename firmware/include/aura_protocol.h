#pragma once

#include <stdint.h>

class Stream;

namespace aura_protocol
{
constexpr uint8_t kMaxCommandLength = 64;

enum class Category
{
  State,
  Activity,
  Attention,
  Heartbeat,
  Metric,
  Progress,
  Summary,
  Unknown,
};

enum class State
{
  Idle,
  Thinking,
  Working,
  Waiting,
  Error,
  Success,
  Unknown,
};

enum class Activity
{
  Read,
  Search,
  Edit,
  Shell,
  Test,
  Other,
  Unknown,
};

enum class Attention
{
  Permission,
  UserInput,
  Confirmation,
  Authentication,
  ManualAction,
  Unknown,
};

struct ParseResult
{
  Category category = Category::Unknown;
  State state = State::Unknown;
  Activity activity = Activity::Unknown;
  Attention attention = Attention::Unknown;
  uint32_t value = 0;
  uint32_t completed = 0;
  uint32_t total = 0;
  bool accepted = false;
};

/** Parse one complete, NUL-terminated protocol line without allocating. */
ParseResult parseLine(const char *line);

class Parser
{
public:
  /** Consume available bytes and return at most one completed command. */
  bool process(Stream &stream, ParseResult &result);

private:
  char buffer_[kMaxCommandLength + 1] = {};
  uint8_t length_ = 0;
  bool discarding_ = false;
};
}
