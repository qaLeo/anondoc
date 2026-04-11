// ============================================================
// СЛОВАРИ ИМЁН И ФАМИЛИЙ ДЛЯ ЕВРОПЕЙСКОГО ДВИЖКА ANONDOC
// Источники:
// DE: Wikipedia List of common surnames in Germany (2021),
//     firstnamesgermany.com, Standesamt statistics
// FR: INSEE Fichier des prénoms 1900-2024,
//     familynames.org/country/france, Quora top-500 FR surnames
// EN: ONS (Office for National Statistics) England & Wales,
//     taliesin-arlein.net (ONS 2002 database, 54.4M people)
// ============================================================

// ============================================================
// ГЕРМАНИЯ — ИМЕНА
// ============================================================

export const DE_FIRST_NAMES_MALE = new Set([
  // Топ современных (2020-2025, firstnamesgermany.com)
  'Noah', 'Leon', 'Luca', 'Finn', 'Ben',
  'Elias', 'Jonas', 'Felix', 'Paul', 'Luis',
  'Maximilian', 'Max', 'Emil', 'Oskar', 'Henry',
  'Anton', 'Moritz', 'Julian', 'David', 'Jan',
  'Lukas', 'Niklas', 'Simon', 'Tobias', 'Tim',
  'Tom', 'Erik', 'Nico', 'Nils', 'Kai',
  'Fabian', 'Patrick', 'Sebastian', 'Florian', 'Daniel',
  'Philipp', 'Christian', 'Stefan', 'Michael', 'Andreas',
  'Thomas', 'Markus', 'Christoph', 'Martin', 'Oliver',

  // Классические немецкие (Standesamt, частые в рабочей документации)
  'Alexander', 'Benjamin', 'Dominik', 'Hendrik', 'Johannes',
  'Klaus', 'Peter', 'Ralf', 'Stephan', 'Uwe',
  'Wolfgang', 'Bernd', 'Dieter', 'Ernst', 'Frank',
  'Friedrich', 'Georg', 'Günter', 'Harald', 'Hans',
  'Heinz', 'Herbert', 'Hermann', 'Horst', 'Jörg',
  'Josef', 'Jürgen', 'Karl', 'Kurt', 'Manfred',
  'Otto', 'Rainer', 'Rudolf', 'Werner', 'Wilhelm',
  'Armin', 'Axel', 'Björn', 'Carsten', 'Claus',
  'Dennis', 'Erich', 'Gerhard', 'Gerd', 'Heiko',
  'Holger', 'Ingo', 'Jochen', 'Lars', 'Marco',
  'Matthias', 'Maurice', 'Norbert', 'Olaf', 'Ralph',
  'Rene', 'Robert', 'Roland', 'Roman', 'Sascha',
  'Sven', 'Thorsten', 'Ulf', 'Ulrich', 'Volker',

  // Новые популярные (2010-2020)
  'Aaron', 'Adrian', 'Benedikt', 'Bruno', 'Christopher',
  'Constantin', 'Eduard', 'Emilio', 'Frederick', 'Gabriel',
  'Gustav', 'Jacob', 'Johann', 'Jonathan', 'Joshua',
  'Kilian', 'Konstantin', 'Lasse', 'Lennart', 'Leopold',
  'Levin', 'Linus', 'Louis', 'Marek', 'Milan',
  'Miro', 'Noel', 'Quentin', 'Rico', 'Robin',
  'Samuel', 'Tillmann', 'Tristan', 'Valentin', 'Vincent',
  'Viktor', 'Xaver', 'Yannik', 'Yannick', 'Yannis',
]);

export const DE_FIRST_NAMES_FEMALE = new Set([
  // Топ современных (2020-2025)
  'Emma', 'Emilia', 'Hannah', 'Mia', 'Sofia',
  'Lena', 'Anna', 'Lea', 'Laura', 'Lina',
  'Clara', 'Marie', 'Leonie', 'Lisa', 'Amelie',
  'Nora', 'Mila', 'Charlotte', 'Luisa', 'Julia',
  'Sophie', 'Sarah', 'Jana', 'Nina', 'Linda',

  // Классические (частые в документах HR/юрид.)
  'Andrea', 'Angela', 'Birgit', 'Christine', 'Claudia',
  'Elisabeth', 'Eva', 'Franziska', 'Heike', 'Inge',
  'Karen', 'Katrin', 'Maria', 'Monika', 'Nicole',
  'Petra', 'Regina', 'Sandra', 'Silke', 'Stefanie',
  'Susanne', 'Tanja', 'Ursula', 'Ulrike', 'Verena',
  'Anja', 'Bettina', 'Brigitte', 'Doris', 'Erika',
  'Gabi', 'Gabriele', 'Helga', 'Hildegard', 'Ilse',
  'Ingrid', 'Irene', 'Margit', 'Renate', 'Rita',
  'Rosemarie', 'Ruth', 'Sigrid', 'Sonja', 'Ute',

  // Новые популярные (2005-2020)
  'Alina', 'Alisa', 'Antonia', 'Carla', 'Elena',
  'Elisa', 'Elsa', 'Frieda', 'Greta', 'Helena',
  'Ida', 'Ines', 'Isabell', 'Jacqueline', 'Johanna',
  'Josephine', 'Judith', 'Katharina', 'Kathrin', 'Klara',
  'Kristina', 'Lara', 'Larissa', 'Lena', 'Leonora',
  'Lilli', 'Lilly', 'Lotte', 'Luise', 'Magdalena',
  'Maren', 'Martina', 'Melanie', 'Melissa', 'Michelle',
  'Nadine', 'Natalie', 'Nathalie', 'Nele', 'Paula',
  'Sabine', 'Sabrina', 'Selina', 'Simone', 'Sina',
  'Svenja', 'Theresa', 'Vanessa', 'Victoria', 'Yasmin',

  // Составные (типичны для Германии)
  'Anna-Lena', 'Anna-Maria', 'Eva-Maria', 'Hanna-Maria',
  'Katharina-Maria', 'Lena-Maria', 'Marie-Sophie',
]);

// ============================================================
// ГЕРМАНИЯ — ФАМИЛИИ
// Источник: Wikipedia List of most common surnames in Germany
// (данные Bundesstatistik, 2021, ~83M человек)
// ============================================================

export const DE_SURNAMES = new Set([
  // Топ-50 (> 100 000 носителей)
  'Müller', 'Schmidt', 'Schneider', 'Fischer', 'Weber',
  'Meyer', 'Wagner', 'Becker', 'Schulz', 'Hoffmann',
  'Schäfer', 'Koch', 'Bauer', 'Richter', 'Klein',
  'Wolf', 'Schröder', 'Neumann', 'Schwarz', 'Zimmermann',
  'Braun', 'Krüger', 'Hofmann', 'Hartmann', 'Lange',
  'Schmitt', 'Werner', 'Schmitz', 'Krause', 'Meier',
  'Lehmann', 'Schmid', 'Schulze', 'Maier', 'Köhler',
  'Herrmann', 'König', 'Walter', 'Mayer', 'Huber',
  'Kaiser', 'Fuchs', 'Peters', 'Lang', 'Scholz',
  'Möller', 'Weiß', 'Jung', 'Hahn', 'Schubert',

  // Топ 51-150
  'Vogel', 'Friedrich', 'Keller', 'Günther', 'Frank',
  'Berger', 'Winkler', 'Roth', 'Beck', 'Lorenz',
  'Baumann', 'Franke', 'Albrecht', 'Schuster', 'Simon',
  'Ludwig', 'Böhm', 'Winter', 'Kraus', 'Martin',
  'Schenk', 'Sauer', 'Arnold', 'Bergmann', 'Brandt',
  'Dietrich', 'Engel', 'Ernst', 'Gross', 'Günter',
  'Haas', 'Hansen', 'Heinrich', 'Henning', 'Herzog',
  'Horn', 'Jäger', 'Jahn', 'Kern', 'Kiefer',
  'Kraft', 'Kremer', 'Kühn', 'Kunze', 'Langer',
  'Lenz', 'Lindner', 'Lohmann', 'Metz', 'Michels',
  'Müller', 'Naumann', 'Neuhaus', 'Nowak', 'Otto',
  'Paul', 'Pfeiffer', 'Pohl', 'Ritter', 'Röder',
  'Seidel', 'Simons', 'Sommer', 'Stein', 'Steinberg',
  'Storch', 'Streit', 'Theis', 'Vogt', 'Voss',
  'Wahl', 'Weise', 'Wolff', 'Ziegler', 'Zimmerer',

  // Топ 151-300 (часто встречаются в HR документах)
  'Abel', 'Adam', 'Bauer', 'Baumgarten', 'Bayer',
  'Berg', 'Blum', 'Böttcher', 'Brauer', 'Breuer',
  'Brunner', 'Buck', 'Busch', 'Decker', 'Degenhardt',
  'Diehl', 'Dörr', 'Dreher', 'Dressler', 'Eckert',
  'Ehlers', 'Eichhorn', 'Falk', 'Fiedler', 'Fleck',
  'Förster', 'Freund', 'Frey', 'Fried', 'Fromm',
  'Geiger', 'Gerber', 'Gerlach', 'Glaser', 'Götz',
  'Graf', 'Greiner', 'Grimm', 'Grün', 'Gutenberg',
  'Haber', 'Hamann', 'Hammer', 'Hanke', 'Harder',
  'Hartung', 'Heck', 'Held', 'Heller', 'Henke',
  'Herr', 'Hess', 'Hesse', 'Heuberger', 'Hilf',
  'Hinz', 'Höfer', 'Höhn', 'Hörmann', 'Hubert',
  'Hübner', 'Jaeger', 'Jansen', 'Kaufmann', 'Kirst',
  'Kluge', 'Knapp', 'Knauer', 'Knopp', 'Knorr',
  'Korte', 'Kreutz', 'Küster', 'Langer', 'Laub',
  'Lauer', 'Laufer', 'Laux', 'Ley', 'Licht',
  'Link', 'Löffler', 'Loos', 'Mann', 'Mayer',
  'Meckel', 'Mende', 'Merkel', 'Messner', 'Metz',
  'Moll', 'Moser', 'Münch', 'Münter', 'Nagler',
  'Neff', 'Nickel', 'Niemann', 'Noll', 'Nolte',
  'Pfaff', 'Pfister', 'Pilz', 'Pöhler', 'Popp',
  'Probst', 'Reichert', 'Reimann', 'Reimer', 'Reuter',
  'Rieger', 'Riedel', 'Riedl', 'Rieß', 'Ring',
  'Römer', 'Roos', 'Rose', 'Rosenbaum', 'Ruf',
  'Sander', 'Schäffler', 'Schalk', 'Scharf', 'Scheid',

  // Составные фамилии (типичны для Германии)
  'von der Heyden', 'von Müller', 'von Schmidt',
  'Müller-Schmidt', 'Schneider-Meyer', 'Weber-Koch',
]);

// ============================================================
// ФРАНЦИЯ — ИМЕНА
// Источник: INSEE Fichier des prénoms 1900-2024
// https://www.insee.fr/fr/statistiques/8595113
// ============================================================

export const FR_FIRST_NAMES_MALE = new Set([
  // Топ 2020-2024 (INSEE)
  'Gabriel', 'Raphaël', 'Léo', 'Louis', 'Lucas',
  'Arthur', 'Hugo', 'Tom', 'Théo', 'Nathan',
  'Noah', 'Ethan', 'Liam', 'Mathis', 'Axel',
  'Nael', 'Maël', 'Yanis', 'Adam', 'Enzo',
  'Julien', 'Antoine', 'Nicolas', 'Clément', 'Thomas',

  // Классические (1970-2000, часты в рабочей документации)
  'Alexandre', 'Alexis', 'Arnaud', 'Baptiste', 'Benjamin',
  'Charles', 'Christian', 'Christophe', 'Cyril', 'David',
  'Denis', 'Didier', 'Édouard', 'Emmanuel', 'Eric',
  'Fabien', 'François', 'Frédéric', 'Gauthier', 'Gilles',
  'Grégoire', 'Guillaume', 'Jérémy', 'Joël', 'Jonathan',
  'Jordan', 'Kevin', 'Laurent', 'Luc', 'Mathieu',
  'Maxime', 'Mickaël', 'Olivier', 'Pascal', 'Philippe',
  'Pierre', 'Quentin', 'Romain', 'Samuel', 'Sébastien',
  'Simon', 'Stéphane', 'Tristan', 'Valentin', 'Victor',
  'Vincent', 'Xavier', 'Yannick', 'Yoann', 'Yves',

  // Традиционные (1940-1970)
  'Alain', 'Bernard', 'Claude', 'Daniel', 'Franck',
  'Gérard', 'Henri', 'Jacques', 'Jean', 'Jean-Claude',
  'Jean-François', 'Jean-Louis', 'Jean-Luc', 'Jean-Marc',
  'Jean-Paul', 'Jean-Pierre', 'Jean-Yves', 'Joseph',
  'Marc', 'Marcel', 'Michel', 'Patrick', 'Paul',
  'Raymond', 'René', 'Richard', 'Robert', 'Roger',
  'Roland', 'Serge', 'Thierry', 'Benoît', 'Bruno',

  // Новые (2000-2015)
  'Adrien', 'Aurélien', 'Dorian', 'Emile', 'Florian',
  'Guillaume', 'Kévin', 'Loïc', 'Maxence', 'Nicolas',
  'Paul', 'Remy', 'Robin', 'Ryan', 'Steven',
  'Théodore', 'Thibault', 'Thibaut', 'Timothée', 'Valentin',
]);

export const FR_FIRST_NAMES_FEMALE = new Set([
  // Топ 2020-2024 (INSEE)
  'Emma', 'Louise', 'Jade', 'Alice', 'Chloé',
  'Lina', 'Mia', 'Léa', 'Inès', 'Rose',
  'Romy', 'Nora', 'Zoé', 'Nina', 'Eva',
  'Lucie', 'Léonie', 'Victoria', 'Juliette', 'Camille',

  // Классические (1970-2000)
  'Adèle', 'Amélie', 'Anaïs', 'Aurélie', 'Céline',
  'Charlotte', 'Claire', 'Clémence', 'Corinne', 'Delphine',
  'Élise', 'Élodie', 'Émilie', 'Estelle', 'Isabelle',
  'Julie', 'Laetitia', 'Laure', 'Laurence', 'Laura',
  'Manon', 'Marie', 'Mathilde', 'Mélanie', 'Mélissa',
  'Pauline', 'Sandrine', 'Séverine', 'Soixante', 'Sophie',
  'Stéphanie', 'Sylvie', 'Valentine', 'Valérie', 'Vanessa',
  'Véronique', 'Virginie', 'Yasmine', 'Éloïse', 'Océane',

  // Традиционные (1940-1970)
  'Brigitte', 'Catherine', 'Colette', 'Danielle', 'Dominique',
  'Françoise', 'Geneviève', 'Jacqueline', 'Jeannine', 'Jocelyne',
  'Josette', 'Liliane', 'Madeleine', 'Martine', 'Michelle',
  'Michèle', 'Monique', 'Nicole', 'Odette', 'Simone',
  'Suzanne', 'Yvette', 'Yvonne', 'Annick', 'Bernadette',
  'Christiane', 'Claudette', 'Claudine', 'Denise', 'Ginette',

  // Новые (2000-2015)
  'Alexia', 'Alicia', 'Alix', 'Ambre', 'Amelia',
  'Anaëlle', 'Angélique', 'Anissa', 'Anna', 'Axelle',
  'Carla', 'Clara', 'Clémence', 'Coralie', 'Elena',
  'Elisa', 'Elise', 'Elsa', 'Emeline', 'Enora',
  'Fanny', 'Flora', 'Floriane', 'Gaëlle', 'Héloïse',
  'Jade', 'Jessica', 'Johanna', 'Julia', 'Justine',
  'Laura', 'Lena', 'Léonie', 'Lilou', 'Lola',
  'Louna', 'Luna', 'Maëlis', 'Maëlle', 'Maeva',
  'Maëva', 'Magali', 'Malika', 'Marilou', 'Marina',
  'Marion', 'Maéva', 'Mélina', 'Melodie', 'Morgane',
  'Nadia', 'Nadège', 'Naomi', 'Noemie', 'Noémie',
  'Océane', 'Ophélie', 'Oriane', 'Orléane', 'Perrine',
  'Rachel', 'Romane', 'Sabrina', 'Sarah', 'Sara',
  'Soline', 'Tiffany', 'Tiphanie', 'Victoire', 'Viola',
  'Wendy', 'Wiktoria', 'Zélie',

  // Двойные имена (типичны для Франции)
  'Anne-Sophie', 'Anne-Claire', 'Marie-Claire', 'Marie-Hélène',
  'Marie-Christine', 'Marie-France', 'Marie-Laure', 'Marie-Noëlle',
  'Marie-Pierre', 'Marie-Thérèse', 'Marie-Yvonne',
  'Jean-Marie', // унисекс
]);

// ============================================================
// ФРАНЦИЯ — ФАМИЛИИ
// Источник: familynames.org/country/france + INSEE + Quora top-500
// ============================================================

export const FR_SURNAMES = new Set([
  // Топ-50 (Martin ~315k носителей)
  'Martin', 'Bernard', 'Dubois', 'Thomas', 'Robert',
  'Richard', 'Petit', 'Durand', 'Leroy', 'Moreau',
  'Simon', 'Laurent', 'Lefebvre', 'Michel', 'Garcia',
  'David', 'Bertrand', 'Roux', 'Vincent', 'Fournier',
  'Morel', 'Girard', 'André', 'Lefèvre', 'Mercier',
  'Dupont', 'Lambert', 'Bonnet', 'François', 'Martinez',
  'Legrand', 'Garnier', 'Faure', 'Rousseau', 'Blanc',
  'Guérin', 'Muller', 'Henry', 'Roussel', 'Nicolas',
  'Perrin', 'Morin', 'Mathieu', 'Clément', 'Gauthier',
  'Dumont', 'Lopez', 'Fontaine', 'Chevalier', 'Robin',

  // Топ 51-150
  'Masson', 'Sanchez', 'Gérard', 'Nguyen', 'Boyer',
  'Denis', 'Lemaire', 'Duval', 'Joly', 'Gautier',
  'Roger', 'Roche', 'Roy', 'Noel', 'Meyer',
  'Lucas', 'Meunier', 'Jean', 'Perez', 'Marchand',
  'Dufour', 'Blanchard', 'Marie', 'Barbier', 'Brun',
  'Dumas', 'Brunet', 'Schmitt', 'Leroux', 'Colin',
  'Fernandez', 'Pierre', 'Renard', 'Arnaud', 'Gilles',
  'Picard', 'Guyot', 'Chevallier', 'Collet', 'Humbert',
  'Bourgeois', 'Renaud', 'Charpentier', 'Aubert', 'Leblanc',
  'Jacquet', 'Briand', 'Vidal', 'Rolland', 'Leclercq',

  // Топ 151-300
  'Tessier', 'Fleury', 'Caron', 'Baudoin', 'Delaunay',
  'Millet', 'Lagrange', 'Lévêque', 'Philippe', 'Marin',
  'Lepage', 'Barre', 'Pons', 'Bailly', 'Hervé',
  'Moulin', 'Leduc', 'Dupuy', 'Guillou', 'Pelletier',
  'Payet', 'Bourdin', 'Coulon', 'Lemaitre', 'Ollivier',
  'Benoit', 'Berthelot', 'Grondin', 'Hamon', 'Renault',
  'Deschamps', 'Poirier', 'Rivière', 'Delorme', 'Boucher',
  'Pichon', 'Pineau', 'Besnard', 'Gros', 'Herve',
  'Chollet', 'Ferreira', 'Coste', 'Lacombe', 'Verdier',
  'Masse', 'Martel', 'Dupré', 'Lamy', 'Baron',

  // Топ 301-500 (из Quora top-500 список)
  'Loiseau', 'Marty', 'Martineau', 'Lejeune', 'Ménard',
  'Chapuis', 'Hubert', 'Michaud', 'Couturier', 'Bertin',
  'Bouchet', 'Pommier', 'Lacroix', 'Laporte', 'Laborde',
  'Laborie', 'Bousquet', 'Castellan', 'Gaillard', 'Guillot',
  'Thibaut', 'Thiébaut', 'Giraud', 'Girault', 'Perrot',
  'Perrault', 'Breton', 'Lesage', 'Pasquier', 'Magnin',
  'Maillet', 'Remy', 'Rémy', 'Mace', 'Macé',
  'Basset', 'Bazin', 'Billard', 'Billaud', 'Bodard',
  'Bois', 'Bonneau', 'Bonnier', 'Bosc', 'Bossard',
  'Bouvet', 'Brard', 'Braud', 'Bréard', 'Brière',
  'Guy', 'Guyon', 'Guyonnet', 'Habert', 'Hamelin',
  'Hamel', 'Hanin', 'Hebert', 'Hébert', 'Hérault',
  'Hoarau', 'Hoareau', 'Huet', 'Humeau', 'Jacquot',
  'Jourdain', 'Jourdan', 'Joubert', 'Jouvet', 'Julien',
  'Labat', 'Lacoste', 'Lahaye', 'Laine', 'Lainé',
  'Lamotte', 'Lapeyre', 'Latour', 'Lauture', 'Laval',
  'Lavigne', 'Laville', 'Lebon', 'Leclerc', 'Lecocq',
  'Leconte', 'Lecomte', 'Lecoq', 'Lefranc', 'Lelièvre',

  // Частицы (de, du, le — часть фамилии)
  'de la Fontaine', 'du Bois', 'le Goff', 'le Bras',
  'de Gaulle', 'du Moulin', 'le Floc\'h', 'du Pont',
]);

// ============================================================
// ВЕЛИКОБРИТАНИЯ / АНГЛИЯ — ИМЕНА
// Источник: ONS (Office for National Statistics) England & Wales
// ============================================================

export const EN_FIRST_NAMES_MALE = new Set([
  // Топ 2020-2024 (ONS)
  'Oliver', 'Harry', 'George', 'Noah', 'Jack',
  'Charlie', 'Jacob', 'Alfie', 'Freddie', 'Oscar',
  'James', 'William', 'Leo', 'Henry', 'Archie',
  'Ethan', 'Joseph', 'Joshua', 'Thomas', 'Samuel',
  'Alexander', 'Daniel', 'Liam', 'Lucas', 'Mason',

  // Классические (1970-2000)
  'Adam', 'Aaron', 'Benjamin', 'Callum', 'Cameron',
  'Christopher', 'Connor', 'David', 'Dylan', 'Edward',
  'Elliot', 'Elliott', 'Finley', 'Finlay', 'Flynn',
  'George', 'Harrison', 'Isaac', 'Jamie', 'Jason',
  'Jay', 'Jordan', 'Josh', 'Justin', 'Kyle',
  'Lee', 'Lewis', 'Luca', 'Mark', 'Matthew',
  'Max', 'Michael', 'Nathan', 'Nicholas', 'Patrick',
  'Paul', 'Peter', 'Philip', 'Richard', 'Robert',
  'Ryan', 'Scott', 'Sean', 'Simon', 'Stephen',
  'Steven', 'Stuart', 'Taylor', 'Timothy', 'Tom',
  'Tyler', 'Zach', 'Zachary', 'Aiden', 'Aidan',

  // Традиционные (1940-1970)
  'Alan', 'Albert', 'Alfred', 'Anthony', 'Arthur',
  'Barry', 'Brian', 'Charles', 'Colin', 'Dennis',
  'Derek', 'Donald', 'Douglas', 'Eric', 'Francis',
  'Frank', 'Frederick', 'Geoffrey', 'Gerald', 'Gordon',
  'Graham', 'Harold', 'Ian', 'John', 'Jonathan',
  'Keith', 'Kenneth', 'Kevin', 'Leonard', 'Leslie',
  'Martin', 'Neil', 'Nigel', 'Norman', 'Raymond',
  'Roger', 'Ronald', 'Russell', 'Terry', 'Trevor',
  'Victor', 'Walter', 'Warren', 'Wayne', 'Colin',
]);

export const EN_FIRST_NAMES_FEMALE = new Set([
  // Топ 2020-2024 (ONS)
  'Olivia', 'Amelia', 'Isla', 'Ava', 'Emily',
  'Isabella', 'Mia', 'Poppy', 'Ella', 'Lily',
  'Sophia', 'Sophie', 'Grace', 'Evie', 'Alice',
  'Florence', 'Freya', 'Charlotte', 'Daisy', 'Evelyn',
  'Emma', 'Harper', 'Scarlett', 'Jessica', 'Hannah',

  // Классические (1970-2000)
  'Amy', 'Beth', 'Chloe', 'Claire', 'Danielle',
  'Eleanor', 'Elizabeth', 'Ellie', 'Gemma', 'Georgia',
  'Holly', 'Jade', 'Jennifer', 'Kate', 'Katie',
  'Laura', 'Lauren', 'Leah', 'Lucy', 'Megan',
  'Molly', 'Natalie', 'Nicole', 'Rachel', 'Rebecca',
  'Rosie', 'Ruby', 'Samantha', 'Sarah', 'Shannon',
  'Stephanie', 'Summer', 'Zoe', 'Abigail', 'Alexandra',
  'Amy', 'Anna', 'Beth', 'Bethany', 'Brittany',
  'Caitlin', 'Casey', 'Christina', 'Courtney', 'Crystal',
  'Dawn', 'Donna', 'Hayley', 'Heather', 'Helen',
  'Jamie', 'Jane', 'Janet', 'Joanne', 'Julie',
  'Karen', 'Katherine', 'Kelly', 'Kerry', 'Kim',
  'Kirsty', 'Leanne', 'Linda', 'Lisa', 'Louise',
  'Michelle', 'Nicola', 'Paula', 'Rachael', 'Sandra',
  'Sharon', 'Stacy', 'Stacey', 'Susan', 'Tracy',
  'Victoria', 'Wendy', 'Yvonne',

  // Традиционные (1940-1970)
  'Barbara', 'Betty', 'Brenda', 'Carol', 'Carolyn',
  'Christine', 'Diane', 'Dorothy', 'Eileen', 'Elaine',
  'Frances', 'Gloria', 'Irene', 'Judith', 'Joyce',
  'Kathleen', 'Lorraine', 'Margaret', 'Marilyn', 'Marion',
  'Marjorie', 'Mary', 'Maureen', 'Pamela', 'Patricia',
  'Pauline', 'Ruth', 'Sally', 'Sheila', 'Shirley',
  'Teresa', 'Valerie', 'Vera', 'Violet',
]);

// ============================================================
// ВЕЛИКОБРИТАНИЯ — ФАМИЛИИ
// Источник: ONS England & Wales database (taliesin-arlein.net)
// 54.4 million people, September 2002
// ============================================================

export const EN_SURNAMES = new Set([
  // Топ-50 (Smith ~500k в UK)
  'Smith', 'Jones', 'Williams', 'Taylor', 'Brown',
  'Davies', 'Evans', 'Wilson', 'Thomas', 'Roberts',
  'Johnson', 'Walker', 'Wright', 'Thompson', 'White',
  'Hughes', 'Edwards', 'Green', 'Hall', 'Wood',
  'Harris', 'Martin', 'Jackson', 'Clarke', 'Clark',
  'Turner', 'Robinson', 'Hill', 'Campbell', 'Anderson',
  'Mitchell', 'Moore', 'Cooper', 'Young', 'Baker',
  'King', 'Lee', 'Allen', 'Carter', 'Parker',
  'Morgan', 'Murray', 'Scott', 'Bennett', 'Watson',
  'Brooks', 'Price', 'Ward', 'Bell', 'Cook',

  // Топ 51-150
  'James', 'Lewis', 'Phillips', 'Shaw', 'Morris',
  'Bailey', 'Rogers', 'Reed', 'Collins', 'Ross',
  'Powell', 'Cox', 'Richardson', 'Howard', 'Watson',
  'Brooks', 'Kelly', 'Barnes', 'Ellis', 'Adams',
  'Fox', 'Fisher', 'Murphy', 'Russell', 'Griffin',
  'Marshall', 'Sullivan', 'Stevens', 'Wallace', 'Pierce',
  'Palmer', 'Mills', 'Crawford', 'Harvey', 'Porter',
  'Henderson', 'Gardner', 'Chapman', 'Grant', 'Stone',
  'Hamilton', 'Hart', 'Butler', 'Fisher', 'Howard',
  'Oliver', 'Webb', 'Ryan', 'Nicholson', 'Curtis',

  // Топ 151-300
  'Matthews', 'Lawson', 'Duncan', 'Barker', 'Elliott',
  'Boyd', 'Hudson', 'Black', 'Graham', 'Reid',
  'Spencer', 'Mason', 'McDonald', 'Fleming', 'Lawrence',
  'Fletcher', 'Brooks', 'Owen', 'Shaw', 'Burton',
  'Nash', 'Ball', 'Doyle', 'Austin', 'Burns',
  'Cooke', 'Dixon', 'Hayward', 'Holland', 'Hunt',
  'May', 'Newman', 'Perkins', 'Simmons', 'Warren',
  'Watts', 'Webb', 'Williamson', 'Willis', 'Wood',
  'Atkinson', 'Barton', 'Bishop', 'Booth', 'Boyd',
  'Bradley', 'Briggs', 'Buckley', 'Burgess', 'Burns',

  // Топ 301-500 (ONS database)
  'Carpenter', 'Carroll', 'Carson', 'Casey', 'Chapman',
  'Cheung', 'Christensen', 'Clayton', 'Coles', 'Connell',
  'Conway', 'Coulson', 'Cross', 'Cunningham', 'Dalton',
  'Daniels', 'Davidson', 'Dean', 'Dennis', 'Dickson',
  'Donaldson', 'Douglas', 'Dunn', 'Dyer', 'Eaton',
  'Faulkner', 'Fenton', 'Ferguson', 'Ford', 'Fowler',
  'Francis', 'Franklin', 'Freeman', 'Fuller', 'Gibson',
  'Gilbert', 'Gill', 'Glover', 'Goodwin', 'Gordon',
  'Griffiths', 'Hale', 'Hanson', 'Hardy', 'Harrington',
  'Harrison', 'Hawkins', 'Hicks', 'Higgins', 'Hooper',
  'Hopkins', 'Horton', 'Houghton', 'Howell', 'Hubbard',
  'Hunt', 'Hunter', 'Hutchinson', 'Ingram', 'Jennings',
  'Joyce', 'Kane', 'Keane', 'Kemp', 'Kendall',
  'Kennedy', 'Kirk', 'Lamb', 'Lambert', 'Lane',
  'Larkin', 'Lawton', 'Leach', 'Leonard', 'Levy',
  'Lindsay', 'Lister', 'Livingstone', 'Lloyd', 'Long',
  'Lord', 'Lynch', 'Lyons', 'Mackenzie', 'Mackay',
  'Marsh', 'Maxwell', 'McCall', 'McCarthy', 'McCoy',
  'McLean', 'McNeil', 'Mead', 'Middleton', 'Miles',
  'Miller', 'Monks', 'Montgomery', 'Moran', 'Morton',
  'Moss', 'Moyes', 'Mullins', 'Munroe', 'Myers',
  'Norris', 'Norton', 'Nuttall', 'O\'Brien', 'O\'Connor',
  'O\'Neill', 'O\'Sullivan', 'Osborne', 'Page', 'Payne',
  'Pearce', 'Pearson', 'Peck', 'Peel', 'Pennington',
  'Pepper', 'Peters', 'Petersen', 'Piper', 'Plant',
  'Platt', 'Poole', 'Potter', 'Preston', 'Prior',
  'Quinn', 'Ramsay', 'Randall', 'Rawlings', 'Ray',
  'Rees', 'Reynolds', 'Rice', 'Richards', 'Riley',
  'Robb', 'Robertson', 'Robson', 'Rodgers', 'Rowland',
  'Sherwood', 'Short', 'Skinner', 'Slater', 'Sloane',
  'Smart', 'Stevenson', 'Stewart', 'Stokes', 'Stone',
  'Strange', 'Stubbs', 'Sutton', 'Swift', 'Tanner',
  'Tate', 'Thornton', 'Timms', 'Todd', 'Tomlinson',
  'Tracey', 'Tracy', 'Truman', 'Tucker', 'Turnbull',
  'Tyler', 'Underwood', 'Vaughan', 'Vaughn', 'Vernon',
  'Vincent', 'Walsh', 'Walton', 'Warwick', 'Waters',
  'Watkins', 'Weaver', 'Webster', 'Welch', 'West',
  'Wheeler', 'Whitfield', 'Whittaker', 'Wilkins', 'Wilkinson',
  'Wills', 'Windsor', 'Winters', 'Wise', 'Yates',
]);

// ============================================================
// ВСПОМОГАТЕЛЬНЫЕ НАБОРЫ
// ============================================================

// Все имена объединённые (для быстрой проверки)
export const ALL_DE_NAMES = new Set([
  ...DE_FIRST_NAMES_MALE,
  ...DE_FIRST_NAMES_FEMALE,
]);

export const ALL_FR_NAMES = new Set([
  ...FR_FIRST_NAMES_MALE,
  ...FR_FIRST_NAMES_FEMALE,
]);

export const ALL_EN_NAMES = new Set([
  ...EN_FIRST_NAMES_MALE,
  ...EN_FIRST_NAMES_FEMALE,
]);

// Функция проверки — является ли слово именем в данном языке
export function isFirstName(word: string, lang: 'de' | 'fr' | 'en'): boolean {
  const normalized = word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
  switch (lang) {
    case 'de': return ALL_DE_NAMES.has(normalized) || ALL_DE_NAMES.has(word);
    case 'fr': return ALL_FR_NAMES.has(normalized) || ALL_FR_NAMES.has(word);
    case 'en': return ALL_EN_NAMES.has(normalized) || ALL_EN_NAMES.has(word);
    default: return false;
  }
}

// Функция проверки — является ли слово фамилией
export function isSurname(word: string, lang: 'de' | 'fr' | 'en'): boolean {
  const normalized = word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
  switch (lang) {
    case 'de': return DE_SURNAMES.has(normalized) || DE_SURNAMES.has(word);
    case 'fr': return FR_SURNAMES.has(normalized) || FR_SURNAMES.has(word);
    case 'en': return EN_SURNAMES.has(normalized) || EN_SURNAMES.has(word);
    default: return false;
  }
}

// Статистика словарей
export const DICTIONARY_STATS = {
  de: {
    maleNames: DE_FIRST_NAMES_MALE.size,
    femaleNames: DE_FIRST_NAMES_FEMALE.size,
    surnames: DE_SURNAMES.size,
    total: DE_FIRST_NAMES_MALE.size + DE_FIRST_NAMES_FEMALE.size + DE_SURNAMES.size,
  },
  fr: {
    maleNames: FR_FIRST_NAMES_MALE.size,
    femaleNames: FR_FIRST_NAMES_FEMALE.size,
    surnames: FR_SURNAMES.size,
    total: FR_FIRST_NAMES_MALE.size + FR_FIRST_NAMES_FEMALE.size + FR_SURNAMES.size,
  },
  en: {
    maleNames: EN_FIRST_NAMES_MALE.size,
    femaleNames: EN_FIRST_NAMES_FEMALE.size,
    surnames: EN_SURNAMES.size,
    total: EN_FIRST_NAMES_MALE.size + EN_FIRST_NAMES_FEMALE.size + EN_SURNAMES.size,
  },
};
