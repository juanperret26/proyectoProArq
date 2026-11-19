-- Generado por scripts/generate-seed.ts. No editar a mano.

-- Reproducible: reemplaza los datos de ejemplo (source_site = 'seed').

-- Falla si ya hay cotizaciones que referencian esos proveedores o productos.

delete from public.products where source_site = 'seed';
delete from public.suppliers where source_site = 'seed';

insert into public.countries (code, name_en, name_es) values
  ('CN', 'China', 'China'),
  ('IN', 'India', 'India'),
  ('TW', 'Taiwan', 'Taiwán'),
  ('TR', 'Turkey', 'Turquía'),
  ('VN', 'Vietnam', 'Vietnam')
on conflict (code) do nothing;

insert into public.categories (slug, name_en, name_es, position) values
  ('cement-concrete', 'Cement & concrete', 'Cemento y hormigón', 0),
  ('steel-structures', 'Steel & structures', 'Acero y estructuras', 1),
  ('tiles-ceramics', 'Tiles & ceramics', 'Cerámicos y revestimientos', 2),
  ('sanitary-plumbing', 'Sanitary ware & faucets', 'Sanitarios y grifería', 3),
  ('doors-windows', 'Doors & windows', 'Aberturas', 4),
  ('electrical-lighting', 'Electrical & lighting', 'Electricidad e iluminación', 5),
  ('tools-hardware', 'Tools & hardware', 'Herramientas y ferretería', 6),
  ('insulation-roofing', 'Insulation & roofing', 'Aislantes y techos', 7)
on conflict (slug) do nothing;

insert into public.categories (slug, name_en, name_es, position, parent_id)
select v.slug, v.name_en, v.name_es, v.position, p.id
from (values
  ('portland-cement', 'Portland cement', 'Cemento portland', 0, 'cement-concrete'),
  ('concrete-admixtures', 'Concrete admixtures', 'Aditivos para hormigón', 1, 'cement-concrete'),
  ('concrete-blocks', 'Concrete blocks & pavers', 'Bloques y adoquines de hormigón', 2, 'cement-concrete'),
  ('mortars-adhesives', 'Mortars & tile adhesives', 'Morteros y adhesivos', 3, 'cement-concrete'),
  ('rebar', 'Reinforcing bar', 'Barras de acero para hormigón', 0, 'steel-structures'),
  ('structural-sections', 'Structural sections', 'Perfiles estructurales', 1, 'steel-structures'),
  ('welded-mesh', 'Welded wire mesh', 'Mallas electrosoldadas', 2, 'steel-structures'),
  ('steel-pipes', 'Steel pipes & tubes', 'Caños y tubos de acero', 3, 'steel-structures'),
  ('porcelain-tiles', 'Porcelain tiles', 'Porcelanatos', 0, 'tiles-ceramics'),
  ('ceramic-wall-tiles', 'Ceramic wall tiles', 'Cerámicos de pared', 1, 'tiles-ceramics'),
  ('mosaics', 'Mosaics', 'Mosaicos', 2, 'tiles-ceramics'),
  ('stone-slabs', 'Natural stone slabs', 'Placas de piedra natural', 3, 'tiles-ceramics'),
  ('toilets', 'Toilets', 'Inodoros', 0, 'sanitary-plumbing'),
  ('basins', 'Basins & sinks', 'Lavatorios y bachas', 1, 'sanitary-plumbing'),
  ('faucets', 'Faucets & mixers', 'Griferías y monocomandos', 2, 'sanitary-plumbing'),
  ('pipes-fittings', 'Pipes & fittings', 'Caños y accesorios', 3, 'sanitary-plumbing'),
  ('aluminum-windows', 'Aluminum windows', 'Ventanas de aluminio', 0, 'doors-windows'),
  ('upvc-windows', 'uPVC windows', 'Ventanas de PVC', 1, 'doors-windows'),
  ('interior-doors', 'Interior doors', 'Puertas de interior', 2, 'doors-windows'),
  ('door-hardware', 'Door hardware', 'Herrajes para puertas', 3, 'doors-windows'),
  ('cables-wires', 'Cables & wires', 'Cables y conductores', 0, 'electrical-lighting'),
  ('switches-sockets', 'Switches & sockets', 'Llaves y tomacorrientes', 1, 'electrical-lighting'),
  ('led-lighting', 'LED lighting', 'Iluminación LED', 2, 'electrical-lighting'),
  ('circuit-breakers', 'Circuit breakers', 'Interruptores termomagnéticos', 3, 'electrical-lighting'),
  ('power-tools', 'Power tools', 'Herramientas eléctricas', 0, 'tools-hardware'),
  ('hand-tools', 'Hand tools', 'Herramientas manuales', 1, 'tools-hardware'),
  ('fasteners', 'Fasteners & anchors', 'Fijaciones y anclajes', 2, 'tools-hardware'),
  ('scaffolding', 'Scaffolding & formwork', 'Andamios y encofrados', 3, 'tools-hardware'),
  ('mineral-wool', 'Mineral wool', 'Lana mineral', 0, 'insulation-roofing'),
  ('foam-boards', 'XPS & EPS boards', 'Placas de XPS y EPS', 1, 'insulation-roofing'),
  ('roofing-sheets', 'Roofing sheets', 'Chapas para techos', 2, 'insulation-roofing'),
  ('waterproofing-membranes', 'Waterproofing membranes', 'Membranas impermeabilizantes', 3, 'insulation-roofing')
) as v (slug, name_en, name_es, position, parent_slug)
join public.categories p on p.slug = v.parent_slug
on conflict (slug) do nothing;

insert into public.certifications (code, name) values
  ('ISO9001', 'ISO 9001 Quality Management'),
  ('ISO14001', 'ISO 14001 Environmental Management'),
  ('CE', 'CE Marking'),
  ('ASTM', 'ASTM Compliance'),
  ('SGS', 'SGS Tested'),
  ('BIS', 'BIS Certification (India)')
on conflict (code) do nothing;

insert into public.suppliers (slug, name, country_code, city, founded_year, business_type, is_verified, response_time_hours, description_en, description_es, source_external_id) values
  ('huaxin-building-materials', 'Huaxin Building Materials Co., Ltd.', 'CN', 'Foshan', 1990, 'manufacturer', true, 48, 'Huaxin Building Materials Co., Ltd. is a manufacturer based in Foshan, China, supplying construction materials to importers and contractors worldwide.', 'Huaxin Building Materials Co., Ltd. es un fabricante con sede en Foshan, China, que abastece materiales de construcción a importadores y contratistas de todo el mundo.', 'huaxin-building-materials'),
  ('shreeji-industries', 'Shreeji Industries Pvt. Ltd.', 'IN', 'Morbi', 2002, 'manufacturer', true, 12, 'Shreeji Industries Pvt. Ltd. is a manufacturer based in Morbi, India, supplying construction materials to importers and contractors worldwide.', 'Shreeji Industries Pvt. Ltd. es un fabricante con sede en Morbi, India, que abastece materiales de construcción a importadores y contratistas de todo el mundo.', 'shreeji-industries'),
  ('taiyu-enterprise', 'Taiyu Enterprise Co., Ltd.', 'TW', 'Taichung', 2015, 'trading_company', false, 4, 'Taiyu Enterprise Co., Ltd. is a trading company based in Taichung, Taiwan, supplying construction materials to importers and contractors worldwide.', 'Taiyu Enterprise Co., Ltd. es un empresa comercializadora con sede en Taichung, Taiwán, que abastece materiales de construcción a importadores y contratistas de todo el mundo.', 'taiyu-enterprise'),
  ('anadolu-yapi', 'Anadolu Yapı A.Ş.', 'TR', 'Istanbul', 2009, 'trading_company', true, 4, 'Anadolu Yapı A.Ş. is a trading company based in Istanbul, Turkey, supplying construction materials to importers and contractors worldwide.', 'Anadolu Yapı A.Ş. es un empresa comercializadora con sede en Istanbul, Turquía, que abastece materiales de construcción a importadores y contratistas de todo el mundo.', 'anadolu-yapi'),
  ('viet-phat-materials', 'Viet Phat Materials JSC', 'VN', 'Ho Chi Minh City', 2011, 'manufacturer', true, 12, 'Viet Phat Materials JSC is a manufacturer based in Ho Chi Minh City, Vietnam, supplying construction materials to importers and contractors worldwide.', 'Viet Phat Materials JSC es un fabricante con sede en Ho Chi Minh City, Vietnam, que abastece materiales de construcción a importadores y contratistas de todo el mundo.', 'viet-phat-materials')
on conflict (slug) do nothing;

insert into public.supplier_certifications (supplier_id, certification_code)
select s.id, v.code
from (values
  ('huaxin-building-materials', 'ISO9001'),
  ('shreeji-industries', 'ASTM'),
  ('shreeji-industries', 'CE'),
  ('taiyu-enterprise', 'ISO14001'),
  ('taiyu-enterprise', 'SGS'),
  ('taiyu-enterprise', 'CE'),
  ('anadolu-yapi', 'ASTM'),
  ('anadolu-yapi', 'ISO14001'),
  ('anadolu-yapi', 'ISO9001'),
  ('viet-phat-materials', 'SGS'),
  ('viet-phat-materials', 'ASTM')
) as v (supplier_slug, code)
join public.suppliers s on s.slug = v.supplier_slug
on conflict do nothing;

insert into public.products (supplier_id, category_id, name_en, name_es, description_en, description_es, specs, unit, min_order_qty, lead_time_days, price_from_usd, source_external_id)
select s.id, c.id, v.name_en, v.name_es, v.description_en, v.description_es, v.specs::jsonb, v.unit, v.min_order_qty, v.lead_time_days, v.price_from_usd, v.external_id
from (values
  ('huaxin-building-materials', 'portland-cement', 'Portland cement CEM I 42.5R', 'Cemento portland CEM I 42.5R', 'Portland cement CEM I 42.5R from Huaxin Building Materials Co., Ltd. (Foshan). Complies with EN 197-1. Minimum order 50 ton.', 'Cemento portland CEM I 42.5R de Huaxin Building Materials Co., Ltd. (Foshan). Cumple con EN 197-1. Pedido mínimo 50 ton.', '[{"label_en":"Grade","label_es":"Clase","value":"CEM I 42.5R"},{"label_en":"Standard","label_es":"Norma","value":"EN 197-1"}]', 'ton', 50, 21, 77.64, 'seed-p-0001'),
  ('huaxin-building-materials', 'structural-sections', 'Structural steel section HEB 160', 'Perfil de acero estructural HEB 160', 'Structural steel section HEB 160 from Huaxin Building Materials Co., Ltd. (Foshan). Complies with EN 10025. Minimum order 20 ton.', 'Perfil de acero estructural HEB 160 de Huaxin Building Materials Co., Ltd. (Foshan). Cumple con EN 10025. Pedido mínimo 20 ton.', '[{"label_en":"Section","label_es":"Perfil","value":"HEB 160"},{"label_en":"Standard","label_es":"Norma","value":"EN 10025"}]', 'ton', 20, 32, 743.04, 'seed-p-0071'),
  ('huaxin-building-materials', 'mosaics', 'Mosaic tile porcelain 300x300 mm', 'Mosaico de porcelana 300x300 mm', 'Mosaic tile porcelain 300x300 mm from Huaxin Building Materials Co., Ltd. (Foshan). Complies with ISO 10545. Minimum order 100 m2.', 'Mosaico de porcelana 300x300 mm de Huaxin Building Materials Co., Ltd. (Foshan). Cumple con ISO 10545. Pedido mínimo 100 m2.', '[{"label_en":"Material","label_es":"Material","value":"porcelain 300x300 mm"},{"label_en":"Standard","label_es":"Norma","value":"ISO 10545"}]', 'm2', 100, 34, 29.88, 'seed-p-0141'),
  ('shreeji-industries', 'concrete-admixtures', 'Concrete admixture water reducer', 'Aditivo para hormigón reductor de agua', 'Concrete admixture water reducer from Shreeji Industries Pvt. Ltd. (Morbi). Complies with EN 934-2. Minimum order 5 ton.', 'Aditivo para hormigón reductor de agua de Shreeji Industries Pvt. Ltd. (Morbi). Cumple con EN 934-2. Pedido mínimo 5 ton.', '[{"label_en":"Type","label_es":"Tipo","value":"water reducer"},{"label_en":"Standard","label_es":"Norma","value":"EN 934-2"}]', 'ton', 5, 32, 735.28, 'seed-p-0015'),
  ('shreeji-industries', 'welded-mesh', 'Welded wire mesh sheet Ø8 mm 200x200 mm', 'Malla electrosoldada en paño Ø8 mm 200x200 mm', 'Welded wire mesh sheet Ø8 mm 200x200 mm from Shreeji Industries Pvt. Ltd. (Morbi). Complies with ASTM A1064. Minimum order 200 sheet.', 'Malla electrosoldada en paño Ø8 mm 200x200 mm de Shreeji Industries Pvt. Ltd. (Morbi). Cumple con ASTM A1064. Pedido mínimo 200 sheet.', '[{"label_en":"Mesh","label_es":"Malla","value":"Ø8 mm 200x200 mm"},{"label_en":"Standard","label_es":"Norma","value":"ASTM A1064"}]', 'sheet', 200, 35, 43.12, 'seed-p-0085'),
  ('shreeji-industries', 'stone-slabs', 'Natural stone slab travertine 20 mm', 'Placa de piedra natural travertino 20 mm', 'Natural stone slab travertine 20 mm from Shreeji Industries Pvt. Ltd. (Morbi). Complies with EN 1469. Minimum order 50 m2.', 'Placa de piedra natural travertino 20 mm de Shreeji Industries Pvt. Ltd. (Morbi). Cumple con EN 1469. Pedido mínimo 50 m2.', '[{"label_en":"Stone","label_es":"Piedra","value":"travertine 20 mm"},{"label_en":"Standard","label_es":"Norma","value":"EN 1469"}]', 'm2', 50, 26, 57.58, 'seed-p-0155'),
  ('taiyu-enterprise', 'concrete-blocks', 'Concrete block 400x200x100 mm', 'Bloque de hormigón 400x200x100 mm', 'Concrete block 400x200x100 mm from Taiyu Enterprise Co., Ltd. (Taichung). Complies with EN 771-3. Minimum order 5000 piece.', 'Bloque de hormigón 400x200x100 mm de Taiyu Enterprise Co., Ltd. (Taichung). Cumple con EN 771-3. Pedido mínimo 5000 piece.', '[{"label_en":"Size","label_es":"Medida","value":"400x200x100 mm"},{"label_en":"Standard","label_es":"Norma","value":"EN 771-3"}]', 'piece', 5000, 19, 0.74, 'seed-p-0029'),
  ('taiyu-enterprise', 'steel-pipes', 'Steel pipe 114 mm seamless', 'Caño de acero 114 mm sin costura', 'Steel pipe 114 mm seamless from Taiyu Enterprise Co., Ltd. (Taichung). Complies with ASTM A53 / EN 10219. Minimum order 15 ton.', 'Caño de acero 114 mm sin costura de Taiyu Enterprise Co., Ltd. (Taichung). Cumple con ASTM A53 / EN 10219. Pedido mínimo 15 ton.', '[{"label_en":"Size","label_es":"Medida","value":"114 mm seamless"},{"label_en":"Standard","label_es":"Norma","value":"ASTM A53 / EN 10219"}]', 'ton', 15, 30, 983.86, 'seed-p-0099'),
  ('taiyu-enterprise', 'toilets', 'Toilet two-piece S-trap', 'Inodoro dos piezas descarga horizontal', 'Toilet two-piece S-trap from Taiyu Enterprise Co., Ltd. (Taichung). Complies with EN 997. Minimum order 100 piece.', 'Inodoro dos piezas descarga horizontal de Taiyu Enterprise Co., Ltd. (Taichung). Cumple con EN 997. Pedido mínimo 100 piece.', '[{"label_en":"Type","label_es":"Tipo","value":"two-piece S-trap"},{"label_en":"Standard","label_es":"Norma","value":"EN 997"}]', 'piece', 100, 25, 42.82, 'seed-p-0157'),
  ('anadolu-yapi', 'mortars-adhesives', 'Tile adhesive 25 kg bag C2S1 deformable', 'Adhesivo cerámico bolsa 25 kg C2S1 deformable', 'Tile adhesive 25 kg bag C2S1 deformable from Anadolu Yapı A.Ş. (Istanbul). Complies with EN 12004. Minimum order 500 bag.', 'Adhesivo cerámico bolsa 25 kg C2S1 deformable de Anadolu Yapı A.Ş. (Istanbul). Cumple con EN 12004. Pedido mínimo 500 bag.', '[{"label_en":"Class","label_es":"Clase","value":"C2S1 deformable"},{"label_en":"Standard","label_es":"Norma","value":"EN 12004"}]', 'bag', 500, 20, 6.56, 'seed-p-0043'),
  ('anadolu-yapi', 'porcelain-tiles', 'Porcelain tile 600x600 mm matt', 'Porcelanato 600x600 mm mate', 'Porcelain tile 600x600 mm matt from Anadolu Yapı A.Ş. (Istanbul). Complies with ISO 13006. Minimum order 500 m2.', 'Porcelanato 600x600 mm mate de Anadolu Yapı A.Ş. (Istanbul). Cumple con ISO 13006. Pedido mínimo 500 m2.', '[{"label_en":"Size","label_es":"Formato","value":"600x600 mm matt"},{"label_en":"Standard","label_es":"Norma","value":"ISO 13006"}]', 'm2', 500, 18, 9.71, 'seed-p-0113'),
  ('anadolu-yapi', 'basins', 'Basin pedestal 550 mm', 'Lavatorio con pedestal 550 mm', 'Basin pedestal 550 mm from Anadolu Yapı A.Ş. (Istanbul). Complies with EN 14688. Minimum order 100 piece.', 'Lavatorio con pedestal 550 mm de Anadolu Yapı A.Ş. (Istanbul). Cumple con EN 14688. Pedido mínimo 100 piece.', '[{"label_en":"Mounting","label_es":"Montaje","value":"pedestal 550 mm"},{"label_en":"Standard","label_es":"Norma","value":"EN 14688"}]', 'piece', 100, 25, 27.77, 'seed-p-0171'),
  ('viet-phat-materials', 'rebar', 'Reinforcing bar Ø10 mm B500B', 'Barra de acero para hormigón Ø10 mm B500B', 'Reinforcing bar Ø10 mm B500B from Viet Phat Materials JSC (Ho Chi Minh City). Complies with ASTM A615 / BS 4449. Minimum order 25 ton.', 'Barra de acero para hormigón Ø10 mm B500B de Viet Phat Materials JSC (Ho Chi Minh City). Cumple con ASTM A615 / BS 4449. Pedido mínimo 25 ton.', '[{"label_en":"Diameter","label_es":"Diámetro","value":"Ø10 mm B500B"},{"label_en":"Standard","label_es":"Norma","value":"ASTM A615 / BS 4449"}]', 'ton', 25, 36, 467.41, 'seed-p-0057'),
  ('viet-phat-materials', 'ceramic-wall-tiles', 'Ceramic wall tile 250x400 mm beige matt', 'Cerámico de pared 250x400 mm beige mate', 'Ceramic wall tile 250x400 mm beige matt from Viet Phat Materials JSC (Ho Chi Minh City). Complies with ISO 13006. Minimum order 800 m2.', 'Cerámico de pared 250x400 mm beige mate de Viet Phat Materials JSC (Ho Chi Minh City). Cumple con ISO 13006. Pedido mínimo 800 m2.', '[{"label_en":"Size","label_es":"Formato","value":"250x400 mm beige matt"},{"label_en":"Standard","label_es":"Norma","value":"ISO 13006"}]', 'm2', 800, 33, 6.58, 'seed-p-0127'),
  ('viet-phat-materials', 'faucets', 'Faucet bath shower mixer', 'Grifería mezcladora de ducha y baño', 'Faucet bath shower mixer from Viet Phat Materials JSC (Ho Chi Minh City). Complies with EN 817. Minimum order 200 piece.', 'Grifería mezcladora de ducha y baño de Viet Phat Materials JSC (Ho Chi Minh City). Cumple con EN 817. Pedido mínimo 200 piece.', '[{"label_en":"Style","label_es":"Estilo","value":"bath shower mixer"},{"label_en":"Standard","label_es":"Norma","value":"EN 817"}]', 'piece', 200, 28, 15.34, 'seed-p-0185')
) as v (supplier_slug, category_slug, name_en, name_es, description_en, description_es, specs, unit, min_order_qty, lead_time_days, price_from_usd, external_id)
join public.suppliers s on s.slug = v.supplier_slug
join public.categories c on c.slug = v.category_slug
on conflict (source_site, source_external_id) do nothing;

insert into public.price_tiers (product_id, min_qty, unit_price_usd)
select p.id, v.min_qty, v.unit_price_usd
from (values
  ('seed-p-0001', 50, 88.22),
  ('seed-p-0001', 250, 82.93),
  ('seed-p-0001', 1000, 77.64),
  ('seed-p-0071', 20, 844.36),
  ('seed-p-0071', 100, 793.7),
  ('seed-p-0071', 400, 743.04),
  ('seed-p-0141', 100, 33.95),
  ('seed-p-0141', 500, 31.91),
  ('seed-p-0141', 2000, 29.88),
  ('seed-p-0015', 5, 835.55),
  ('seed-p-0015', 25, 785.42),
  ('seed-p-0015', 100, 735.28),
  ('seed-p-0085', 200, 49),
  ('seed-p-0085', 1000, 46.06),
  ('seed-p-0085', 4000, 43.12),
  ('seed-p-0155', 50, 65.43),
  ('seed-p-0155', 250, 61.51),
  ('seed-p-0155', 1000, 57.58),
  ('seed-p-0029', 5000, 0.85),
  ('seed-p-0029', 25000, 0.79),
  ('seed-p-0029', 100000, 0.74),
  ('seed-p-0099', 15, 1118.03),
  ('seed-p-0099', 75, 1050.94),
  ('seed-p-0099', 300, 983.86),
  ('seed-p-0157', 100, 48.65),
  ('seed-p-0157', 500, 45.73),
  ('seed-p-0157', 2000, 42.82),
  ('seed-p-0043', 500, 7.46),
  ('seed-p-0043', 2500, 7.01),
  ('seed-p-0043', 10000, 6.56),
  ('seed-p-0113', 500, 11.03),
  ('seed-p-0113', 2500, 10.37),
  ('seed-p-0113', 10000, 9.71),
  ('seed-p-0171', 100, 31.55),
  ('seed-p-0171', 500, 29.66),
  ('seed-p-0171', 2000, 27.77),
  ('seed-p-0057', 25, 531.14),
  ('seed-p-0057', 125, 499.27),
  ('seed-p-0057', 500, 467.41),
  ('seed-p-0127', 800, 7.48),
  ('seed-p-0127', 4000, 7.03),
  ('seed-p-0127', 16000, 6.58),
  ('seed-p-0185', 200, 17.43),
  ('seed-p-0185', 1000, 16.38),
  ('seed-p-0185', 4000, 15.34)
) as v (external_id, min_qty, unit_price_usd)
join public.products p on p.source_site = 'seed' and p.source_external_id = v.external_id
on conflict do nothing;
