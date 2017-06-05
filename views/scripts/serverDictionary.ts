/// <reference path="../node_modules/@types/jquery/index.d.ts" />
/// <reference path="knApi.ts" />

class ServerDictionary implements KNApi.JapaneseDictionary
{
    lookupWord(id: string): JQueryPromise<KNApi.DbWord> {
        // http://localhost:3000/api/v1/word/食品
        return $.get("/api/v1/word/" + id);
    }
    
    lookupKanji(id: string): JQueryPromise<KNApi.DbKanji> {
        // http://localhost:3000/api/v1/kanji/品
        return $.get("/api/v1/kanji/" + id);
    }
}

export let Dictionary: KNApi.JapaneseDictionary = new ServerDictionary();
