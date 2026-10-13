-- Correct the stored format (link_type) for the 28 book rows.
-- Share links carry no extension, so every one of them was labelled "pdf" —
-- including 10 Word documents, 2 EPUBs, and one PDF that was typed as a video.
-- The reader uses this to pick a viewer, so it has to be right.
BEGIN;

-- A Guide to Hacking  (youtube -> pdf)
UPDATE content_items SET link_type='pdf' WHERE id='01a8829c-5db2-4df0-b85e-1fcaebd9c41d' AND link_type='youtube';

-- Dictionary of Body language  (pdf -> epub)
UPDATE content_items SET link_type='epub' WHERE id='07a93033-b852-4693-b87e-d3c955a5db69' AND link_type='pdf';

-- The Brutal Truth About Friendship  (pdf -> docx)
UPDATE content_items SET link_type='docx' WHERE id='1590cc46-56ec-48b2-b475-97191bd78ead' AND link_type='pdf';

-- The_Hidden_Brutal_Truth_About_Work  (pdf -> docx)
UPDATE content_items SET link_type='docx' WHERE id='2baeaa8d-da56-4332-ac13-673d857ea9c5' AND link_type='pdf';

-- psychology of money  (pdf -> docx)
UPDATE content_items SET link_type='docx' WHERE id='2d6e322d-7306-49cf-89b2-a7a95e7fbf2b' AND link_type='pdf';

-- Dark psychology 7 in 1  (pdf -> epub)
UPDATE content_items SET link_type='epub' WHERE id='2e761faf-eb7b-47cb-b910-0d2dc2f4a8cf' AND link_type='pdf';

-- The Hidden Brutal Truth About Money  (pdf -> docx)
UPDATE content_items SET link_type='docx' WHERE id='46e7612b-a70f-46c0-8a93-ba9962e3f4c3' AND link_type='pdf';

-- The hidden Truth about Happiness  (pdf -> docx)
UPDATE content_items SET link_type='docx' WHERE id='4d9a6412-30df-4a42-a58c-62e8ba9adc74' AND link_type='pdf';

-- The Brutal Truth About Success  (pdf -> docx)
UPDATE content_items SET link_type='docx' WHERE id='53024789-1206-4f7c-8aaf-8e9b4630bef7' AND link_type='pdf';

-- A complete guide for getting out of debt  (pdf -> docx)
UPDATE content_items SET link_type='docx' WHERE id='5bc932e9-6e44-4234-9c2c-a019894bcc97' AND link_type='pdf';

-- financial_independence_guide  (pdf -> docx)
UPDATE content_items SET link_type='docx' WHERE id='9f88f750-c821-478c-8fbb-6c1860c165d8' AND link_type='pdf';

-- 30day-money-reset  (pdf -> docx)
UPDATE content_items SET link_type='docx' WHERE id='e8a329a6-78aa-46ed-a591-e92c2f076c62' AND link_type='pdf';

-- The Brutal Truth About Love  (pdf -> docx)
UPDATE content_items SET link_type='docx' WHERE id='f1cdb449-fdea-44f7-b634-4502e1ee2be9' AND link_type='pdf';

COMMIT;
