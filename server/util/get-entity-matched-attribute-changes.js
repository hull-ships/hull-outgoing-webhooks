// @flow
const _ = require("lodash");

function getEntityMatchedAttributeChanges(
  webhooks_attributes: Array<string>,
  changes: Object,
  targetEntity: string
): Array<string> {
  let changesPath;
  if (targetEntity === "user") {
    changesPath = "user.";
  } else if (targetEntity === "account") {
    changesPath = ""; // account changes in webhooks_attributes by default are account.${attribute}
  }

  return _.filter(webhooks_attributes, webhook_attribute => {
    const traitsPrefix = `traits_${webhook_attribute}`;

    const attribute = _.get(
      changes,
      `${changesPath}${webhook_attribute}`,
      null
    );

    const traitsPrefixAttribute = _.get(
      changes,
      `${changesPath}${traitsPrefix}`,
      null
    );

    return attribute !== null || traitsPrefixAttribute !== null;
  });
}

module.exports = getEntityMatchedAttributeChanges;
