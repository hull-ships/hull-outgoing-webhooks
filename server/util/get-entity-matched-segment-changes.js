// @flow
const _ = require("lodash");

function getEntityMatchedSegmentChanges(
  webhooks_segments: Array<Object>,
  changes: Object = {},
  action: string = "left",
  targetEntity: string = "user"
): Array<Object> {
  const { segments = {}, account_segments = {} } = changes;
  const entitySegments = targetEntity === "user" ? segments : account_segments;

  if (!_.size(entitySegments)) {
    return [];
  }

  const current = entitySegments[action] || [];
  if (!current.length) {
    return [];
  }

  // Get list of segments we're validating against for a given changeset
  const filter = _.map(_.filter(webhooks_segments, e => e[action]), "segment");

  // List of User segments matching entered or left
  return _.filter(current, s => _.includes(filter, s.id));
}

module.exports = getEntityMatchedSegmentChanges;
