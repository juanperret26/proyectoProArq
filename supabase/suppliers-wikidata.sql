-- Proveedores reales cargados desde Wikidata (datos abiertos, licencia CC0).
-- Fuente de cada fila: https://www.wikidata.org/wiki/<source_external_id>
-- Solo datos de empresa (nombre, sede, anio de fundacion). Sin productos ni
-- precios: Wikidata no los publica, y no se inventan para empresas reales.
-- business_type = 'manufacturer' es una inferencia a partir del sector.
-- is_verified = false: ninguna de estas empresas esta verificada en ProArq.
-- Ejecutar una vez en el SQL Editor. Es repetible (on conflict do nothing).

insert into public.suppliers
  (slug, name, country_code, city, founded_year, business_type, is_verified,
   description_en, description_es, source_site, source_url, source_external_id, scraped_at)
values
  ('anhui-conch-cement', 'Anhui Conch Cement Co., Ltd.', 'CN', 'Wuhu', 1997, 'manufacturer', false,
   'Anhui Conch Cement Co., Ltd. is a cement producer based in Wuhu, China. Company profile from Wikidata.',
   'Anhui Conch Cement Co., Ltd. es un productor de cemento con sede en Wuhu, China. Perfil de empresa tomado de Wikidata.',
   'wikidata', 'https://www.wikidata.org/wiki/Q545565', 'Q545565', now()),
  ('china-baowu-steel-group', 'China Baowu Steel Group', 'CN', 'Shanghai', 1978, 'manufacturer', false,
   'China Baowu Steel Group is an iron and steel producer based in Shanghai, China. Company profile from Wikidata.',
   'China Baowu Steel Group es un productor de hierro y acero con sede en Shanghái, China. Perfil de empresa tomado de Wikidata.',
   'wikidata', 'https://www.wikidata.org/wiki/Q249692', 'Q249692', now()),
  ('opple-lighting', 'Opple Lighting', 'CN', 'Shanghai', 2008, 'manufacturer', false,
   'Opple Lighting is a lighting manufacturer based in Shanghai, China. Company profile from Wikidata.',
   'Opple Lighting es un fabricante de iluminación con sede en Shanghái, China. Perfil de empresa tomado de Wikidata.',
   'wikidata', 'https://www.wikidata.org/wiki/Q17013089', 'Q17013089', now()),
  ('wonder-cement', 'Wonder Cement', 'IN', 'Udaipur', 2010, 'manufacturer', false,
   'Wonder Cement is a cement producer based in Udaipur, India. Company profile from Wikidata.',
   'Wonder Cement es un productor de cemento con sede en Udaipur, India. Perfil de empresa tomado de Wikidata.',
   'wikidata', 'https://www.wikidata.org/wiki/Q107304807', 'Q107304807', now()),
  ('pennar-industries', 'Pennar Industries Ltd', 'IN', 'Patancheru', 1977, 'manufacturer', false,
   'Pennar Industries Ltd is a steel products manufacturer based in Patancheru, India. Company profile from Wikidata.',
   'Pennar Industries Ltd es un fabricante de productos de acero con sede en Patancheru, India. Perfil de empresa tomado de Wikidata.',
   'wikidata', 'https://www.wikidata.org/wiki/Q122919271', 'Q122919271', now()),
  ('laxcon-steels', 'Laxcon Steels Limited', 'IN', 'Ahmedabad', 1978, 'manufacturer', false,
   'Laxcon Steels Limited is a steel producer based in Ahmedabad, India. Company profile from Wikidata.',
   'Laxcon Steels Limited es un productor de acero con sede en Ahmedabad, India. Perfil de empresa tomado de Wikidata.',
   'wikidata', 'https://www.wikidata.org/wiki/Q141147954', 'Q141147954', now()),
  ('asia-cement-corporation', 'Asia Cement Corporation', 'TW', 'Taipei', 1957, 'manufacturer', false,
   'Asia Cement Corporation is a cement producer based in Taipei, Taiwan. Company profile from Wikidata.',
   'Asia Cement Corporation es un productor de cemento con sede en Taipéi, Taiwán. Perfil de empresa tomado de Wikidata.',
   'wikidata', 'https://www.wikidata.org/wiki/Q16834530', 'Q16834530', now()),
  ('gloria-material-technology', 'Gloria Material Technology Corp.', 'TW', 'Tainan', 1993, 'manufacturer', false,
   'Gloria Material Technology Corp. is a steel company based in Tainan, Taiwan. Company profile from Wikidata.',
   'Gloria Material Technology Corp. es una empresa de acero con sede en Tainan, Taiwán. Perfil de empresa tomado de Wikidata.',
   'wikidata', 'https://www.wikidata.org/wiki/Q5571430', 'Q5571430', now()),
  ('china-steel-corporation', 'China Steel Corporation', 'TW', 'Kaohsiung', 1971, 'manufacturer', false,
   'China Steel Corporation is an iron and steel producer based in Kaohsiung, Taiwan. Company profile from Wikidata.',
   'China Steel Corporation es un productor de hierro y acero con sede en Kaohsiung, Taiwán. Perfil de empresa tomado de Wikidata.',
   'wikidata', 'https://www.wikidata.org/wiki/Q712863', 'Q712863', now()),
  ('sisecam', 'Şişecam', 'TR', 'Istanbul', 1935, 'manufacturer', false,
   'Şişecam is a glass manufacturer based in Istanbul, Turkey. Company profile from Wikidata.',
   'Şişecam es un fabricante de vidrio con sede en Estambul, Turquía. Perfil de empresa tomado de Wikidata.',
   'wikidata', 'https://www.wikidata.org/wiki/Q8082554', 'Q8082554', now()),
  ('erdemir', 'Erdemir', 'TR', 'Karadeniz Ereğli', 1965, 'manufacturer', false,
   'Erdemir is an iron and steel producer based in Karadeniz Ereğli, Turkey. Company profile from Wikidata.',
   'Erdemir es un productor de hierro y acero con sede en Karadeniz Ereğli, Turquía. Perfil de empresa tomado de Wikidata.',
   'wikidata', 'https://www.wikidata.org/wiki/Q934796', 'Q934796', now()),
  ('kardemir', 'Kardemir', 'TR', 'Karabük', 1937, 'manufacturer', false,
   'Kardemir is an iron and steel producer based in Karabük, Turkey. Company profile from Wikidata.',
   'Kardemir es un productor de hierro y acero con sede en Karabük, Turquía. Perfil de empresa tomado de Wikidata.',
   'wikidata', 'https://www.wikidata.org/wiki/Q6100799', 'Q6100799', now()),
  ('dai-viet-mechanical-trading-production', 'Dai Viet Mechanical Trading Production Co., Ltd', 'VN', 'Nhơn Trạch', 2016, 'manufacturer', false,
   'Dai Viet Mechanical Trading Production Co., Ltd is a stainless steel fabrication company based in Nhơn Trạch, Vietnam. Company profile from Wikidata.',
   'Dai Viet Mechanical Trading Production Co., Ltd es una empresa de fabricación en acero inoxidable con sede en Nhơn Trạch, Vietnam. Perfil de empresa tomado de Wikidata.',
   'wikidata', 'https://www.wikidata.org/wiki/Q138657794', 'Q138657794', now())
on conflict (slug) do nothing;
