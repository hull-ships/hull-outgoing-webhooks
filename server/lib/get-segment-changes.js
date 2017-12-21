import _ from "lodash";

export default function getSegmentChanges(
  webhooks_segments,
  changes = {},
  action = "left"
) {
  const { segments = {} } = changes;
  if (!_.size(segments)) return [];
  const current = segments[action] || [];
  if (!current.length) return [];

  // Get list of segments we're validating against for a given changeset
  const filter = _.map(_.filter(webhooks_segments, e => e[action]), "segment");

  // List of User segments matching entered or left
  return _.filter(current, s => _.includes(filter, s.id));
}
