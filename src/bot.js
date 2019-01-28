const Telegraf = require('telegraf');
const Extra = require('telegraf/extra');
const marathonBot = new Telegraf(process.env.HLFBOT_TOKEN);
const Promo = require('./schema');

const MAX_PROMO_QTY = 5;

/**
 * Commands
 */
const helpCommand = ({ reply }) => {
  const helpMessage = `
    Для получиния промо-кода введите команду:
    /promo ВАШ_ID ФАМИЛИЯ_TAB_TEAM КОЛИЧЕСТВО_ПРОМОКОДОВ
    Например: /promo 1234567890 Анцибор 5
    Максимальное количество промо-кодов на один ID - 5
  `;
  reply(helpMessage);
};

const promoCommand = async ({ reply, from, message: { text } }) => {
  const pattern = /\/promo\s+(\d+)\s+([A-zА-я]+)\s+(\d+)/;
  if (pattern.test(text)) {
    const match = text.match(pattern);
    const partnerId = match[1];
    const tabTeam = match[2];
    const codeQty = Number(match[3]);

    if (codeQty > MAX_PROMO_QTY) {
      return reply(
        `Вы запросили *${codeQty}* промо-кодов!\nК сожалению, максимальное количество промо-кодов на один ID - 5`,
        Extra.markdown()
      );
    }

    // check how many promo codes were used by this partner
    const usedPromoCount = await Promo.countDocuments({
      isUsed: true,
      ipId: partnerId
    });

    if (usedPromoCount >= MAX_PROMO_QTY) {
      return reply(
        `К сожалению вы исчерпали допустимое количество промо-кодов
        \n_Максимальное количество промо-кодов на один ID - 5_`,
        Extra.markdown()
      );
    }

    // requested amount of promo codes more then promo codes left for this id
    if (MAX_PROMO_QTY - usedPromoCount < codeQty) {
      return reply(
        `🙁 К сожалению мы не можем выдать вам *${codeQty}* промо-кодов
        \n🎁 Вы уже получили *${usedPromoCount}* промо-кодов
        \n💎 У вас осталось *${MAX_PROMO_QTY - usedPromoCount}* промо-кодов
        \n_Максимальное количество промо-кодов на один ID - 5_`,
        Extra.markdown()
      );
    }

    const promoCodes = await Promo.find({ isUsed: false }).limit(codeQty);
    const ids = promoCodes.map(({ _id }) => _id);
    console.log(ids);

    // update used promo with data and save
    const updateResult = await Promo.updateMany(
      { _id: { $in: promoCodes.map(({ _id }) => _id) } },
      { ipId: partnerId, tabTeam, isUsed: true }
    );

    const promoCodesReply = promoCodes
      .map(({ code }) => `🏃‍ *${code}*`)
      .join('\n');

    reply(
      `🎉 *Все готово!* 🎉
      \nКопируйте ваши промо-коды ниже (_${codeQty} штук_)
      \n${promoCodesReply}
      \nУвидимся на финише!`,
      Extra.markdown()
    );
  } else {
    reply('Неверный формат команды! Наберите /help, чтобы для помощи.');
  }
};

const unusedCommand = async ({ reply }) => {
  const unusedPromoCount = await Promo.countDocuments({ isUsed: false });
  reply(`Количество не использованных кодов в базе - ${unusedPromoCount}`);
};

const resetCommand = async ({ reply }) => {
  const resetResponse = await Promo.updateMany(
    {},
    { isUsed: false, tabTeam: '', ipId: '' }
  );
};

/**
 * Register commands
 */
marathonBot.command('promo', promoCommand);
marathonBot.command('unused', unusedCommand);
marathonBot.command('resetallplease', resetCommand);
marathonBot.command('help', helpCommand);

marathonBot.launch();
