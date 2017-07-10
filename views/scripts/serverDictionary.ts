import * as request from "d3-request";

import { DbKanji, DbWord, DictEntry, IJapaneseDictionary } from "./knApi";

class ServerDictionary implements IJapaneseDictionary {

    public doLookup<WordOrKanji extends DictEntry>(id: string, entryType: string): Promise<WordOrKanji> {

        return new Promise<WordOrKanji>((resolve: (data: WordOrKanji) => void, reject: (error: any) => void) => {

            request.json<WordOrKanji>(
                `/api/v1/${entryType}/${id}`,
                (error: any, data: WordOrKanji) => {

                    if (error) {
                        return reject(error);
                    }

                    resolve(data);
                },
            );
        });
    }

    public lookupWord(id: string): Promise<DbWord> {

        return this.doLookup<DbWord>(id, "word");
    }

    public lookupKanji(id: string): Promise<DbKanji> {

        return this.doLookup<DbKanji>(id, "kanji");
    }
}

export let Dictionary: IJapaneseDictionary = new ServerDictionary();
