import Promise from 'bluebird';
import { smartNotifierHandler } from 'hull/lib/utils';
import updateUser from "../lib/update-user";

const notify = smartNotifierHandler({
  handlers: {
    'user:update': (ctx, messages = []) => {
      const { smartNotifierResponse, ship, client: hull } = ctx;

      // Get 10 users every 100ms at most.
      smartNotifierResponse.setFlowControl({
        type: 'next',
        size: 10,
        in: 100,
      });
      return Promise.all(messages.map(message => updateUser(ctx, message)));
    },
  },
});

export default notify;
