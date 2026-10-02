-- Seed HolmanMap locations (run after schema.sql)
-- Uses a system-safe insert without created_by

insert into public.haunted_places (
  title, description, category, spookiness_rating,
  latitude, longitude, nearest_city, status, location
) values
(
  'Borella Cemetery',
  'One of Colombo''s oldest burial grounds. Locals speak of cold spots near the older tombs after dark, and of footsteps that follow you along the central path when the city noise fades.',
  'cemetery',
  4,
  6.9150,
  79.8772,
  'Colombo',
  'approved',
  ST_SetSRID(ST_MakePoint(79.8772, 6.9150), 4326)::geography
),
(
  'St. Andrews Bungalow',
  'A colonial-era bungalow in the hills of Nuwara Eliya. Guests have reported piano notes from empty rooms and a woman in white standing at the upstairs window when no one is staying there.',
  'colonial_bungalow',
  5,
  6.9497,
  80.7891,
  'Nuwara Eliya',
  'approved',
  ST_SetSRID(ST_MakePoint(80.7891, 6.9497), 4326)::geography
),
(
  'Haunted Bend at Hanguranketha',
  'A sharp bend on the road where drivers claim headlights vanish and a figure steps into the road, only to disappear when you brake. Folklore ties the spot to an old accident and unfinished vows.',
  'haunted_junction',
  4,
  7.1750,
  80.7800,
  'Hanguranketha',
  'approved',
  ST_SetSRID(ST_MakePoint(80.7800, 7.1750), 4326)::geography
);

-- Optional placeholder YouTube evidence (replace with real docs as needed)
insert into public.evidence_media (place_id, media_type, url, youtube_id)
select id, 'youtube', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 'dQw4w9WgXcQ'
from public.haunted_places
where title = 'Borella Cemetery'
limit 1;
