import * as KNApi from "./knApi";

class ServerDictionary implements KNApi.IJapaneseDictionary {
    public lookupWord(id: string): JQueryPromise<KNApi.DbWord> {
        // http://localhost:3000/api/v1/word/食品
        return $.get("/api/v1/word/" + id);
    }

    public lookupKanji(id: string): JQueryPromise<KNApi.DbKanji> {
        // http://localhost:3000/api/v1/kanji/品
        return $.get("/api/v1/kanji/" + id);
    }
}

export let Dictionary: KNApi.IJapaneseDictionary = new ServerDictionary();
