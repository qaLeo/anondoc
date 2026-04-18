/**
 * Transliterated Russian names for EU documents.
 * Russian names in DE/FR/EN documents are written in Latin script —
 * these sets enable detection without searching for Cyrillic.
 */

export const RU_SURNAMES_LATIN: Set<string> = new Set([
  'ivanov', 'smirnov', 'kuznetsov', 'popov', 'vasiliev', 'petrov',
  'sokolov', 'mikhailov', 'novikov', 'fedorov', 'morozov', 'volkov',
  'alexeev', 'lebedev', 'semyonov', 'egorov', 'pavlov', 'kozlov',
  'stepanov', 'nikolaev', 'orlov', 'andreev', 'makarov', 'nikitin',
  'zakharov', 'zaytsev', 'solovyov', 'borisov', 'yakovlev', 'grigoryev',
  'romanov', 'vorobiev', 'sergeev', 'kuzmin', 'frolov', 'alexandrov',
  'danilov', 'korolev', 'gusev', 'titov', 'kirillov', 'markov',
  'polyakov', 'gavrilov', 'belyaev', 'tarasov', 'belov', 'komarov',
  'filippov', 'naumov', 'kovalenko', 'bondarenko', 'shevchenko',
  'tkachenko', 'akhmetov',
])

export const RU_NAMES_LATIN: Set<string> = new Set([
  'alexey', 'alexei', 'aleksei', 'alexander', 'aleksandr', 'andrei',
  'andrey', 'anton', 'artem', 'boris', 'denis', 'dmitry', 'dmitri',
  'evgeny', 'fyodor', 'igor', 'ilya', 'ivan', 'kirill', 'konstantin',
  'maxim', 'mikhail', 'nikita', 'nikolai', 'oleg', 'pavel', 'roman',
  'ruslan', 'sergei', 'sergey', 'stanislav', 'timur', 'vadim', 'viktor',
  'vladimir', 'vladislav', 'yuri', 'alina', 'anastasia', 'daria',
  'diana', 'elena', 'ekaterina', 'irina', 'julia', 'ksenia', 'larisa',
  'ludmila', 'marina', 'natalia', 'nadezhda', 'olga', 'polina',
  'svetlana', 'tatiana', 'valentina', 'vera', 'viktoria', 'yulia',
  'yelena', 'zoya',
])
