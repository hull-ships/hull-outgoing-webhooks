# Changelog

## 0.2.10
- treat 200-204 status codes as success

## 0.2.9
- add concurrency support
- upgrade hull-node
- cleanup babeljs and flow configuration, rewrite import/export syntax
- replace request with superagent

## 0.2.8

- re-add smart-notifier
- use hull-connector archetype
- add status endpoint
- refine logging

## 0.2.7

- revert smart-notifier support

## 0.2.6

- add more details to error logs

## 0.2.5

- enable to send all users
- updated pictures

## 0.2.4

- update to hull-node@0.11.8
- update logging to match convention

## 0.2.3

- update to hull-node@0.11.4
- move files to lib directory

## 0.2.2

- update to hull-node@0.11.0
- implement logging convention

## 0.2.1

- update to hull-node@beta
- add batch metrics

## 0.2.0

- [BREAKING] changing the name of segments filter (`segment_filter` -> `synchronized_segments`)
- add prefixing selected attributes with `traits_` to enhance matching (sometimes the event comes with the prefix while the attribute key in settings it without it)
- introduce segments based filtering on the `/batch` endpoint
- enhance the documentation in readme and in settings UI
- cleanup the code
- replace `utils` with `hull-ship-base` prototype

## 0.1.0

- introduce error handling and metrics
