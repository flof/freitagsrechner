# The Friday break is a separate input

The original sketch had no break field: Mon–Thu durations plus a Friday start,
with the departure as `start + remaining`. That is wrong by the length of any
break taken on Friday, which is the one day the tool exists for. We added a
single saved "Pause" field (minutes, default `0`) that is added to the departure
instead of being folded into the Mon–Thu numbers. The alternative — subtracting
a fixed break from every day — would have required guessing break lengths for
days the user has already accounted for.

Consequence: Mon–Thu values are net credited time by definition, so the user
never enters breaks for past days.
