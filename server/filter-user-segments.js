import _ from "lodash";

export default function filterUserSegments({ ship }, notification) {
  const filterSegmentIds = _.get(ship, "private_settings.segment_filter", []);
  return _.intersection(filterSegmentIds, notification.message.segments.map(s => s.id)).length > 0;
}
