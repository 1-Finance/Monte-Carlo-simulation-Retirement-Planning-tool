import serverless from 'serverless-http';
import type { Handler, HandlerEvent, HandlerContext, HandlerResponse } from '@netlify/functions';
import { createApp } from '../../server/app';

type ServerlessHandler = (event: HandlerEvent, context: HandlerContext) => Promise<HandlerResponse>;

let handlerPromise: Promise<ServerlessHandler> | null = null;

function getHandler(): Promise<ServerlessHandler> {
  if (!handlerPromise) {
    handlerPromise = createApp().then((app) => serverless(app) as unknown as ServerlessHandler);
  }
  return handlerPromise;
}

export const handler: Handler = async (event, context) => {
  const h = await getHandler();
  return h(event, context);
};
