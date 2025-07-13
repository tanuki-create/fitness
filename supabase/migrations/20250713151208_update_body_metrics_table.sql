ALTER TABLE public.body_metrics
ADD COLUMN skeletal_muscle_mass NUMERIC(5, 2),
ADD COLUMN body_fat_mass NUMERIC(5, 2),
ADD COLUMN smi NUMERIC(4, 1),
ADD COLUMN bmr INTEGER,
ADD COLUMN visceral_fat_level INTEGER,
ADD COLUMN inbody_score INTEGER;

COMMENT ON COLUMN public.body_metrics.skeletal_muscle_mass IS 'Skeletal Muscle Mass in kg';
COMMENT ON COLUMN public.body_metrics.body_fat_mass IS 'Body Fat Mass in kg';
COMMENT ON COLUMN public.body_metrics.smi IS 'Skeletal Muscle Mass Index (kg/m^2)';
COMMENT ON COLUMN public.body_metrics.bmr IS 'Basal Metabolic Rate in kcal';
COMMENT ON COLUMN public.body_metrics.visceral_fat_level IS 'Visceral Fat Level';
COMMENT ON COLUMN public.body_metrics.inbody_score IS 'InBody Score out of 100';
