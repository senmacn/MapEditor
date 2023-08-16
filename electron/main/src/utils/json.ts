import fastJson from 'fast-json-stringify';

const stringify = fastJson({
  title: 'Saves',
  type: 'object',
  properties: {
    editorConfig: {
      type: 'object',
      properties: {
        color: { type: 'string' },
        lineWidth: { type: 'number' },
        eraseSize: { type: 'number' },
        zoom: { type: 'number' },
        autoConnect: { type: 'boolean' },
        autoConnectScope: { type: 'number' },
        projectSizeConfig: {
          type: 'object',
          properties: {
            Sn: { type: 'string' },
            startPointX: { type: 'number' },
            startPointY: { type: 'number' },
            mapWidth: { type: 'number' },
            mapHeight: { type: 'number' },
            actorWidth: { type: 'number' },
            actorPxWidth: { type: 'number' },
            offsetX: { type: 'number' },
            offsetY: { type: 'number' },
            offsetWidth: { type: 'number' },
            offsetHeight: { type: 'number' },
          },
        },
      },
    },
    layers: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          uuid: {
            type: 'string',
          },
          name: {
            type: 'string',
          },
          lock: {
            type: 'boolean',
          },
          visible: {
            type: 'boolean',
          },
          map: {
            type: 'string',
          },
          transparency: {
            type: 'number',
          },
          areas: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                uuid: { type: 'string' },
                name: { type: 'string' },
                draw: { type: 'string' },
                scale: { type: 'number' },
                type: { type: 'string' },
                visible: { type: 'boolean' },
                boundRect: {
                  type: 'array',
                  items: {
                    type: 'number',
                  },
                },
                choosePoint: {
                  type: 'array',
                  items: {
                    type: 'number',
                  },
                },
                data: {
                  type: 'object',
                  additionalProperties: {
                    type: 'number',
                  },
                },
              },
            },
          },
          pins: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                uuid: { type: 'string' },
                name: { type: 'string' },
                description: { type: 'string' },
                boundRect: {
                  type: 'array',
                  items: {
                    type: 'number',
                  },
                },
                draw: { type: 'string' },
                scale: { type: 'number' },
                visible: { type: 'boolean' },
                author: { type: 'string' },
                state: { type: 'string' },
                jira: { type: 'string' },
                icon: { type: 'string' },
                association: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      uuid: { type: 'string' },
                      name: { type: 'string' },
                      type: { type: 'string' },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
});

export function stringifySave(obj: object | string) {
  try {
    if (typeof obj === 'string') {
      return obj;
    } else {
      const jsonStr = stringify(obj);
      // stringify 解析错误，使用 JSON 的 stringify
      if (jsonStr === '{}') {
        return JSON.stringify(obj);
      }
      return jsonStr;
    }
  } catch (err) {
    throw err;
  }
}
