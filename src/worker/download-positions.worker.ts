import { dataToBin } from '@/views/default-editor/utils/quadtree-utils';

addEventListener(
  'message',
  function (event) {
    const data = event.data;
    // @ts-ignore
    postMessage(dataToBin(...data));
  },
  false,
);
