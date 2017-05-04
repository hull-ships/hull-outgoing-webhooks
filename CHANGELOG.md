# Changelog

## 0.2.1
- update to hull-node@beta
- add batch metrics

## 0.2.0
- BREAKING - chaning the name of segments filter (`segment_filter` -> `synchronized_segments`)
- add prefixing selected attributes with `traits_` to enhance matching (sometimes the event comes with the prefix while the attribute key in settings it without it)
- introduce segments based filtering on the `/batch` endpoint
- enhance the documentation in readme and in settings UI
- cleanup the code
- replace `utils` with `hull-ship-base` prototype



## 0.1.0
- introduce error handling and metrics
