# Changelog

## v0.3.9
- updated status to take away warnings that were not bad

## v0.3.8
- use kraken exports for batches

## v0.3.7
- support account batches

## v0.3.6
- removing multiple channels in manifest

## v0.3.5
- removed a faulty required field validation in manifest

## v0.3.4
- account integration support

## v0.3.3
- upgrade hull-node to overcame batch endpoint failure

## v0.3.2
- improve documentation
- add `account` when processing batch extracts

## v0.3.1
- add `message_id` param to `outgoing.user.start` log line

## v0.3.0
- remove archetype builder
- upgrade dependencies, inlcuding hull-node@0.13.16
- test are run by jest now
- new standard file `notifications-configuration.js` introduced

## v0.2.16
- specify subscription conditions

## v0.2.15
- upgrade hull-node to 0.13.15

## v0.2.14
- add flow control env vars

## v0.2.13
- upgrade hull-node to 0.13.14
- changed http client to not follow redirects and treat them as errors

## v0.2.12
- adds `throttle_rate` and `throttle_per_rate` settings to control throughput
- refactor code into SyncAgent

## v0.2.11
- update documentation for concurrency

## v0.2.10
- treat 200-204 status codes as success

## v0.2.9
- add concurrency support
- upgrade hull-node
- cleanup babeljs and flow configuration, rewrite import/export syntax
- replace request with superagent

## v0.2.8

- re-add smart-notifier
- use hull-connector archetype
- add status endpoint
- refine logging

## v0.2.7

- revert smart-notifier support

## v0.2.6

- add more details to error logs

## v0.2.5

- enable to send all users
- updated pictures

## v0.2.4

- update to hull-node@0.11.8
- update logging to match convention

## v0.2.3

- update to hull-node@0.11.4
- move files to lib directory

## v0.2.2

- update to hull-node@0.11.0
- implement logging convention

## v0.2.1

- update to hull-node@beta
- add batch metrics

## v0.2.0

- [BREAKING] changing the name of segments filter (`segment_filter` -> `synchronized_segments`)
- add prefixing selected attributes with `traits_` to enhance matching (sometimes the event comes with the prefix while the attribute key in settings it without it)
- introduce segments based filtering on the `/batch` endpoint
- enhance the documentation in readme and in settings UI
- cleanup the code
- replace `utils` with `hull-ship-base` prototype

## v0.1.0

- introduce error handling and metrics
