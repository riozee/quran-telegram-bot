export type surah_list = string[];

export type surah_audio = {
	[index: string]: string;
};

export type surah_names = {
	[index: string]: string[];
};

export type surah_transliteration = {
	[index: string]: {
		[index: string]: string;
	};
};

export type surah_info = {
	source: string;
	data: {
		place: string;
		type: string;
		count: number;
		title: string;
		titleAr: string;
		index: string;
		pages: string;
		juz: {
			index: string;
			verse: {
				start: string;
				end: string;
			};
		}[];
	}[];
};

export type surah = {
	[index: string]: {
		number: string;
		name: string;
		name_latin: string;
		number_of_ayah: string;
		text: {
			[index: string]: string;
		};
		translations: {
			id: {
				name: string;
				text: {
					[index: string]: string;
				};
			};
		};
		tafsir: {
			id: {
				kemenag: {
					name: string;
					source: string;
					text: {
						[index: string]: string;
					};
				};
			};
		};
	};
};
