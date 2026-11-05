import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
export function openDatabase(filename) {
  const sqlite = new DatabaseSync(filename);
  sqlite.exec(fs.readFileSync(new URL('./schema.sql',import.meta.url),'utf8'));
  return {
    prepare(sql) {
      const statement = sqlite.prepare(sql);
      return {bind(...args) {return {
        async first() {return statement.get(...args) || null;},
        async run() {const result=statement.run(...args);return {meta:{changes:Number(result.changes)}};}
      };}};
    },
    close() {sqlite.close();}
  };
}
