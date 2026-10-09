-- Keep existing numbered routes and reader responses and replace provisional titles.
UPDATE chapters SET title='Religion' WHERE id=1;
UPDATE chapters SET title='Philosophy' WHERE id=2;
UPDATE chapters SET title='Out-of-Body Experiences' WHERE id=3;
UPDATE chapters SET title='Near-Death Experiences' WHERE id=4;
UPDATE chapters SET title='Children''s Past Lives' WHERE id=5;
UPDATE chapters SET title='Adults'' Past Lives' WHERE id=6;
UPDATE chapters SET title='End-of-Life Phenomena' WHERE id=7;
UPDATE chapters SET title='After Death Encounters' WHERE id=8;
UPDATE chapters SET title='Agents of the Dead (Mediums)' WHERE id=9;
INSERT INTO chapters(id,title) VALUES
  (10,'Mystica'),
  (11,'Consciousness');
