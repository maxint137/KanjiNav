import * as $ from 'jquery'

import { ApiNode, JLPTDictionary, NodeType } from './kanjiNavBase'

class ServerDictionary implements JLPTDictionary
{
    lookup(type: NodeType, id: string, jlptFilter: string): JQueryPromise<any> {

        // http://localhost:3000/api/v1/word/食品
        // http://localhost:3000/api/v1/kanji/品
        var query = "/api/v1/" + type.type + "/" + id + (jlptFilter ? '?JLPT=' + jlptFilter : '');
        return $.get(query);
    }
}

export let Dictionary: JLPTDictionary = new ServerDictionary();
