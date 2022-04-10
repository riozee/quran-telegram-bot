import { Telegraf } from 'telegraf';
import { chunk } from 'lodash';
import * as fs from 'fs';
require('dotenv').config();
import type * as types from './types/types';

const start_message = fs.readFileSync('./res/start_message.txt').toString();
const surah: types.surah = JSON.parse(fs.readFileSync('./res/surah.json').toString());
const surah_names: types.surah_names = JSON.parse(fs.readFileSync('./res/surah_names.json').toString());
const surah_info: types.surah_info = JSON.parse(fs.readFileSync('./res/surah_info.json').toString());
const surah_audio: types.surah_audio = JSON.parse(fs.readFileSync('./res/surah_audio.json').toString());
const surah_list = (JSON.parse(fs.readFileSync('./res/surah_list.json').toString()) as types.surah_list).map((v, i) => `${i + 1}. ${v}`).join('\n');

let savingfileid = '';
const cache: { [s: string]: Surah } = {};
class Surah {
	ok: boolean = true;
	surah_number?: number;
	surah_name?: string;
	surah_name_meaning?: string;
	surah_name_arabic?: string;
	surah_type?: string;
	surah_audio_file_id?: string;
	ayat_number?: number;
	ayat_total?: number;
	ayat_juz?: number;
	arabic_text?: string;
	translation_text?: string;
	tafsir_text?: string;
	tafsir_source?: string;

	constructor(public _surah: string, public _ayat: string) {
		if (isNaN(+_surah)) {
			const _surah_number = Object.entries(surah_names).find((v) => v[1].includes(_surah))?.[0];
			this.surah_number = Number(_surah_number) || undefined;
		} else {
			if (1 <= +_surah && +_surah <= 114) this.surah_number = +_surah;
		}
		if (this.surah_number) {
			this.surah_audio_file_id = surah_audio[this.surah_number];
			const info1 = surah[this.surah_number];
			this.surah_name = info1.name_latin;
			this.surah_name_meaning = info1.translations.id.name;
			this.surah_name_arabic = info1.name;
			const info2 = surah_info.data.find((v) => +v.index === this.surah_number)!;
			this.surah_type = info2.type;
			this.ayat_number = isNaN(+this._ayat) ? 1 : +this._ayat;
			this.ayat_total = info2.count;
			this.ayat_number = this.ayat_number < 1 ? 1 : this.ayat_number > this.ayat_total ? this.ayat_total : this.ayat_number;
			this.ayat_juz = +info2.juz.find((v) => {
				const [start, end]: number[] = Object.values(v.verse).map((v) => +v.slice(6)); // "verse_001"
				return start <= this.ayat_number! && this.ayat_number! <= end;
			})!.index;
			this.arabic_text = info1.text[this.ayat_number];
			this.translation_text = info1.translations.id.text[this.ayat_number];
			this.tafsir_text = info1.tafsir.id.kemenag.text[this.ayat_number];
			this.tafsir_source = info1.tafsir.id.kemenag.source;
		} else {
			this.ok = false;
		}
	}

	info() {
		if (this.ok) {
			return `${this.surah_name} ${this.surah_name_arabic} (${this.surah_name_meaning})\n${this.surah_type}, surat ke-${this.surah_number}\nAyat ke-${this.ayat_number}, Juz ke-${this.ayat_juz}`;
		}
	}
}

function createButtons(Surah: Surah, state: 'arabic' | 'translation' | 'tafsir'): { text: string; callback_data: string }[][];
function createButtons(Surah: Surah, state: 'arabic' | 'translation' | 'tafsir', page: number, pageEnd: number): { text: string; callback_data: string }[][];
function createButtons(Surah: Surah, state: 'arabic' | 'translation' | 'tafsir', page?: number, pageEnd?: number): { text: string; callback_data: string }[][] {
	const rows = [];
	const _ayat = Surah.ayat_number!;
	const _ayat_total = Surah.ayat_total!;
	const _surah = Surah.surah_number!;

	if (page) {
		if (page === 1) {
			rows.push([create('halaman 2 >', `${state},${_surah}:${_ayat}#2`)]);
		} else if (page === pageEnd) {
			rows.push([create(`< halaman ${page - 1}`, `${state},${_surah}:${_ayat}#${page - 1}`)]);
		} else {
			rows.push([
				create(`< halaman ${page - 1}`, `${state},${_surah}:${_ayat}#${page - 1}`),
				create(`halaman ${page + 1} >`, `${state},${_surah}:${_ayat}#${page + 1}`),
			]);
		}
	}

	if (_ayat === 1) {
		rows.push([create(`ayat ${_ayat + 1} >`, `${state},${_surah}:${_ayat + 1}`)]);
	} else if (_ayat === _ayat_total) {
		rows.push([create(`< ayat ${_ayat - 1}`, `${state},${_surah}:${_ayat - 1}`)]);
	} else {
		rows.push([create(`< ayat ${_ayat - 1}`, `${state},${_surah}:${_ayat - 1}`), create(`ayat ${_ayat + 1} >`, `${state},${_surah}:${_ayat + 1}`)]);
	}

	if (state === 'arabic') {
		rows.push([create('Terjemah', `translation,${_surah}:${_ayat}`), create('Tafsir', `tafsir,${_surah}:${_ayat}`)]);
	} else if (state === 'translation') {
		rows.push([create('Arab', `arabic,${_surah}:${_ayat}`), create('Tafsir', `tafsir,${_surah}:${_ayat}`)]);
	} else if (state === 'tafsir') {
		rows.push([create('Arab', `arabic,${_surah}:${_ayat}`), create('Terjemah', `translation,${_surah}:${_ayat}`)]);
	}

	rows.push([create('Audio ayat', `audio,${_surah}:${_ayat}`), create('Audio surat', `audio,${_surah}`)]);

	if (_surah === 1) {
		rows.push([create(`${surah[_surah + 1].name_latin}/${_surah + 1} >`, `${state},${_surah + 1}:1`)]);
	} else if (_surah === 114) {
		rows.push([create(`< ${surah[_surah - 1].name_latin}/${_surah - 1}`, `${state},${_surah - 1}:1`)]);
	} else {
		rows.push([
			create(`< ${surah[_surah - 1].name_latin}/${_surah - 1}`, `${state},${_surah - 1}:1`),
			create(`${surah[_surah + 1].name_latin}/${_surah + 1} >`, `${state},${_surah + 1}:1`),
		]);
	}

	return rows;

	function create(text: string, callback_data: string) {
		return { text: text, callback_data: callback_data };
	}
}

const bot = new Telegraf(process.env.BOT_TOKEN || '');
bot.on('text', async (ctx) => {
	try {
		let text = ctx.message.text;
		if (text.startsWith('/getsurahaudiofileid')) {
			savingfileid = `${ctx.from.id}`;
			return ctx.reply('OK');
		}
		if (`${ctx.from.id}` === process.env.OWNER_USER_ID && text.startsWith('/eval')) {
			return await ctx.reply(require('util').format(eval(text.slice(6))));
		}

		text = text.toLowerCase();
		if (text.startsWith('/start')) {
			return await bot.telegram
				.sendVideo(ctx.from.id, process.env.START_VIDEO_TUTORIAL_FILE_ID!, {
					caption: start_message,
					parse_mode: 'Markdown',
				})
				.catch(() => ctx.reply(start_message, { parse_mode: 'Markdown' }));
		}
		if (text.startsWith('/daftarsurat')) return ctx.reply(surah_list);

		const [_surah, _ayat] = text.split(':').map((v) => v.trim().replace(/[^a-z0-9]/g, ''));
		const surah = new Surah(_surah, _ayat);
		if (surah.ok) {
			await ctx.reply(`${surah.info()}\n\n${surah.arabic_text}`, { reply_markup: { inline_keyboard: createButtons(surah, 'arabic') } });
		} else {
			await ctx.reply(
				`*Surat "${_surah}" tidak ditemukan.*\nPastikan format dan ejaan sudah benar atau gunakan perintah /daftarsurat untuk melihat daftar nama-nama surat.`,
				{ parse_mode: 'Markdown' }
			);
		}
		console.log(`${_surah}:${_ayat}`);
	} catch (e) {
		console.error(e);
		await ctx.reply('*Maaf, terjadi kesalahan.*\nSilakan coba lagi nanti.', { parse_mode: 'Markdown' });
		await bot.telegram.sendMessage(process.env.OWNER_USER_ID!, String(e));
	}
});
bot.on('callback_query', async (ctx) => {
	try {
		// @ts-ignore
		const cb_data = ctx.callbackQuery.data as string;
		const [state, foo] = cb_data.split(',');
		const [_surah, bar] = (foo || '').split(':');
		const [_ayat, _page] = (bar || '').split('#');
		const page: number = isNaN(+_page) ? 1 : +_page;
		const surah = cache[cb_data] || new Surah(_surah, _ayat);
		if (state === 'arabic') {
			await ctx.editMessageText(`${surah.info()}\n\n${surah.arabic_text}`, { reply_markup: { inline_keyboard: createButtons(surah, 'arabic') } });
		} else if (state === 'translation') {
			const text = surah.translation_text!;
			if (text.length > 1096) {
				const chunk_text = chunk(text, 1096).map((v) => v.join(''));
				await ctx.editMessageText(`${surah.info()}\n*Terjemahan:*\n\n${chunk_text[page - 1]}`, {
					reply_markup: { inline_keyboard: createButtons(surah, 'translation', page, chunk_text.length) },
					parse_mode: 'Markdown',
				});
			} else {
				await ctx.editMessageText(`${surah.info()}\n*Terjemahan:*\n\n${text}`, {
					reply_markup: { inline_keyboard: createButtons(surah, 'translation') },
					parse_mode: 'Markdown',
				});
			}
		} else if (state === 'tafsir') {
			const text = surah.tafsir_text!;
			if (text.length > 1096) {
				const chunk_text = chunk(text, 1096).map((v) => v.join(''));
				await ctx.editMessageText(`${surah.info()}\n*Tafsir (Kemenag):*\n\n${chunk_text[page - 1]}`, {
					reply_markup: { inline_keyboard: createButtons(surah, 'tafsir', page, chunk_text.length) },
					parse_mode: 'Markdown',
				});
			} else {
				await ctx.editMessageText(`${surah.info()}\n*Tafsir (Kemenag):*\n\n${text}`, {
					reply_markup: { inline_keyboard: createButtons(surah, 'tafsir') },
					parse_mode: 'Markdown',
				});
			}
		} else if (state === 'audio') {
			if (_ayat) {
				await bot.telegram.sendAudio(ctx.from!.id, { url: `https://api.lolhuman.xyz/api/quran/audio/${_surah}/${_ayat}?apikey=${process.env.LOLHUMAN_API_KEY}` });
			} else {
				await bot.telegram.sendAudio(ctx.from!.id, surah.surah_audio_file_id!);
			}
		}
		await ctx.answerCbQuery();
		if (!cache[cb_data]) {
			cache[cb_data] = surah;
			setTimeout((x) => delete cache[x], 300000, `${cb_data}`);
		}
		console.log(cb_data);
	} catch (e) {
		console.error(e);
		await ctx.answerCbQuery('Maaf, terjadi kesalahan. Silakan coba lagi nanti.');
		await bot.telegram.sendMessage(process.env.OWNER_USER_ID!, String(e));
	}
});
bot.on('inline_query', async (ctx) => {
	try {
		const text = ctx.inlineQuery.query;
		if (!text) return;
		const [_surah, _ayat] = text.split(':').map((v) =>
			v
				.trim()
				.toLowerCase()
				.replace(/[^a-z0-9]/g, '')
		);
		const surah = new Surah(_surah, _ayat);
		if (surah.ok) {
			const results = [
				{
					type: 'article',
					id: `arabic,${surah.surah_number}:${surah.ayat_number}`,
					title: `Arab (${surah.surah_name}/${surah.surah_number}:${surah.ayat_number})`,
					description: surah.arabic_text!.slice(0, 100) + ' ...',
					input_message_content: {
						message_text: surah.arabic_text!,
					},
				},
			];
			if (surah.translation_text!.length > 1096) {
				const _chunk = chunk(surah.translation_text!, 1096).map((v) => v.join(''));
				_chunk.forEach((v, i) => {
					results.push({
						type: 'article',
						id: `translation,${surah.surah_number}:${surah.ayat_number}#${i + 1}`,
						title: `Terjemahan Halaman ${i + 1} (${surah.surah_name}/${surah.surah_number}:${surah.ayat_number})`,
						description: v.slice(0, 100) + ' ...',
						input_message_content: {
							message_text: v,
						},
					});
				});
			} else {
				results.push({
					type: 'article',
					id: `translation,${surah.surah_number}:${surah.ayat_number}`,
					title: `Terjemahan (${surah.surah_name}/${surah.surah_number}:${surah.ayat_number})`,
					description: surah.translation_text!.slice(0, 100) + ' ...',
					input_message_content: {
						message_text: surah.translation_text!,
					},
				});
			}

			if (surah.tafsir_text!.length > 1096) {
				const _chunk = chunk(surah.tafsir_text!, 1096).map((v) => v.join(''));
				_chunk.forEach((v, i) => {
					results.push({
						type: 'article',
						id: `tafsir,${surah.surah_number}:${surah.ayat_number}#${i + 1}`,
						title: `Tafsir Halaman ${i + 1} (${surah.surah_name}/${surah.surah_number}:${surah.ayat_number})`,
						description: v.slice(0, 100) + ' ...',
						input_message_content: {
							message_text: v,
						},
					});
				});
			} else {
				results.push({
					type: 'article',
					id: `tafsir,${surah.surah_number}:${surah.ayat_number}`,
					title: `Tafsir (${surah.surah_name}/${surah.surah_number}:${surah.ayat_number})`,
					description: surah.tafsir_text!.slice(0, 100) + ' ...',
					input_message_content: {
						message_text: surah.tafsir_text!,
					},
				});
			}
			// @ts-ignore
			await ctx.answerInlineQuery(results);
		} else {
			await ctx.answerInlineQuery([
				{
					type: 'article',
					id: `0:0`,
					title: `Surat "${_surah}" tidak ditemukan.`,
					description: 'Pastikan format dan ejaan sudah benar.',
					input_message_content: {
						message_text: 'https://t.me/fio_quran_bot',
					},
				},
			]);
		}
	} catch (e) {
		await ctx.answerInlineQuery([
			{
				type: 'article',
				id: `-1:-1`,
				title: `Maaf, terjadi kesalahan.`,
				description: 'Silakan coba lagi nanti.',
				input_message_content: {
					message_text: 'https://t.me/fio_quran_bot',
				},
			},
		]);
		console.error(e);
	}
});
bot.on('audio', (ctx) => {
	if (savingfileid) {
		if (`${ctx.message.from.id}` === savingfileid && ctx.message.audio.performer?.includes?.('Mishary Rashid')) {
			const index = ctx.message.audio.file_name!.split('.')[0];
			surah_audio[index] = ctx.message.audio.file_id;
			ctx.reply('Saved ' + index);
			if (Object.values(surah_audio).filter(Boolean).length === 114) {
				fs.writeFileSync('./res/surah_audio.json', JSON.stringify(surah_audio, null, '\t'));
				savingfileid = '';
				ctx.reply('Done');
			}
		}
	}
});
bot.launch().then(() => console.log('Connected.'));
