import { ChatBot, type IMessage } from '@mi-gpt/chat';
import type { IReply } from '@mi-gpt/engine/base';
import { type EngineConfig, MiGPTEngine } from '@mi-gpt/engine/index';
import { deepMerge, sleep } from '@mi-gpt/utils';
import type { DeepPartial, Prettify } from '@mi-gpt/utils/typing';
import { MiMessage } from './message.js';
import { MiService, type MiServiceConfig } from './service.js';
import { MiSpeaker } from './speaker.js';

export type MiGPTConfig = Prettify<
  EngineConfig<MiJiaEngine> &
    DeepPartial<{
      debug: boolean;
      speaker: MiServiceConfig & {
        /**
         * 消息轮询间隔（毫秒）
         *
         * 默认 1000（最低 1 秒）
         */
        heartbeat?: number;
      };
    }>
>;

const kDefaultMiGPTConfig: MiGPTConfig = {
  debug: false,
  speaker: {
    heartbeat: 1000,
  },
};

class MiJiaEngine extends MiGPTEngine {
  config: MiGPTConfig = kDefaultMiGPTConfig;

  speaker = MiSpeaker;

  get MiNA() {
    return MiService.MiNA!;
  }

  get MiOT() {
    return MiService.MiOT!;
  }

  async start(config: MiGPTConfig) {
    await super.start(deepMerge(kDefaultMiGPTConfig, config));

    await MiService.init(this.config as any);

    console.log('✅ 服务已启动...');

    // 轮询间隔最小 1 秒
    const heartbeat = Math.max(1000, this.config.speaker!.heartbeat!);

    // 轮询消息
    while (this.status === 'running') {
      const msg = await MiMessage.fetchNextMessage();
      if (msg) {
        this.onMessage(msg);
      }
      await sleep(heartbeat);
    }
  }
  // 与AI聊天
  async askAI(msg: IMessage): Promise<IReply> {
    const text = await ChatBot.chat(msg);
    text = text.replace(/<think>[\s\S]*?<\/think>/g, '').trim()
    return { text };
  }
}

export const MiGPT = new MiJiaEngine();
