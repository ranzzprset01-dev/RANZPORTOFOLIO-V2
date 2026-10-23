const iqcMaker = require('../../plugins/iqcMaker');

module.exports = {
  name: 'iqc',
  alias: ['fakechat'],
  async execute(sock, msg, args) {
    const chatId = msg.key.remoteJid;
    const senderId = msg.key.participant || chatId;
    return iqcMaker.handleIQC(sock, chatId, senderId, args.join(' '), msg);
  }
};
