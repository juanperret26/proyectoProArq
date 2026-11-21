-- Generado por scripts/generate-directory-images-sql.ts. No editar a mano.
-- Fotos de producto tomadas del sitio oficial de cada empresa. Solo completa productos sin foto.
update public.products p
set image_urls = array[v.url]
from (values
  ('sheh-fung-screws-co-ltd-self-drilling-screws', 'https://www.shehfung.com/upload/en/product/17_img_1.png'),
  ('sheh-fung-screws-co-ltd-timber-construction-screws', 'https://www.shehfung.com/upload/en/product/296_img_1.png'),
  ('sheh-fung-screws-co-ltd-drywall-screws', 'https://www.shehfung.com/upload/en/product/19_img_1.png'),
  ('sheh-fung-screws-co-ltd-chipboard-screws', 'https://www.shehfung.com/upload/en/product/227_img_1.png'),
  ('sheh-fung-screws-co-ltd-self-tapping-screws', 'https://www.shehfung.com/upload/en/product/231_img_1.jpg'),
  ('sheh-fung-screws-co-ltd-decking-screws', 'https://www.shehfung.com/upload/en/product/235_img_1.png'),
  ('sheh-fung-screws-co-ltd-self-piercing-screws', 'https://www.shehfung.com/upload/en/product/242_img_1.png'),
  ('sheh-fung-screws-co-ltd-hammer-drill-bits', 'https://www.shehfung.com/upload/en/product/316_img_1.jpg'),
  ('3y-insulation-acoustic-products', 'https://www.3yyalitim.com/uploads/GenelResim/akustik-urunleri-214.png'),
  ('3y-insulation-vibration-damping-mats', 'https://www.3yyalitim.com/uploads/GenelResim/titresim-kesici-silteler-7095.png'),
  ('3y-insulation-air-ducts', 'https://www.3yyalitim.com/uploads/GenelResim/hava-kanallari-3259.png'),
  ('3y-insulation-polyethylene-insulation', 'https://www.3yyalitim.com/uploads/GenelResim/polietilan-3522.png'),
  ('3y-insulation-xps-extruded-polystyrene', 'https://www.3yyalitim.com/uploads/GenelResim/xps-ekstrude-polistren-6239.png'),
  ('3y-insulation-pvc-sound-barrier', 'https://www.3yyalitim.com/uploads/GenelResim/epdm-bariyer-3166.png'),
  ('3y-insulation-acoustic-wood-panels', 'https://www.3yyalitim.com/uploads/GenelResim/akustik-ahsap-paneller-291.png'),
  ('3y-insulation-bondex-sound-insulation-sponge', 'https://www.3yyalitim.com/uploads/GenelResim/bondex-ses-yalitim-sungeri-6169.png'),
  ('3y-insulation-glass-wool', 'https://www.3yyalitim.com/uploads/GenelResim/cam-yunu-4797.png'),
  ('3y-insulation-stone-wool', 'https://www.3yyalitim.com/uploads/GenelResim/tas-yunu-9356.png'),
  ('3y-insulation-elastomeric-rubber-insulation', 'https://www.3yyalitim.com/uploads/GenelResim/elastomerik-kaucuk-4506.png'),
  ('feltouch-feltouch-tondo-acoustic-panel', 'https://feltouch.tr/wp-content/uploads/2026/09/Feltouch_Tondo_Featured_Photo_01.jpg'),
  ('feltouch-feltouch-corten-acoustic-panel', 'https://feltouch.tr/wp-content/uploads/2026/11/Illusion_Corten_Featured_Photo.jpg'),
  ('feltouch-feltouch-stone-acoustic-panel', 'https://feltouch.tr/wp-content/uploads/2026/11/Product_Stone_01.jpg'),
  ('feltouch-feltouch-wood-acoustic-panel', 'https://feltouch.tr/wp-content/uploads/2026/11/Product_Wood_Featured_Photo.jpg'),
  ('feltouch-feltouch-travertine-acoustic-panel', 'https://feltouch.tr/wp-content/uploads/2026/11/Product_Travertain_Featured_Photo.jpg'),
  ('emaks-prime-kapi-ve-mobilya-aksesuarlari-furniture-legs', 'https://emaks.com.tr/ref/class/mainimage/tbm/berva_20240910115813.jpg'),
  ('emaks-prime-kapi-ve-mobilya-aksesuarlari-designer-handles', 'https://emaks.com.tr/ref/class/mainimage/tbm/berva_20221104093625.jpg'),
  ('emaks-prime-kapi-ve-mobilya-aksesuarlari-hangers-and-hooks', 'https://emaks.com.tr/ref/class/mainimage/tbm/berva_20231018074017.jpg'),
  ('assan-panel-biocore-sandwich-panels', 'https://www.assanpanel.com/-/media/images/urunler/sandvic-paneller/biocore/biocore-2.ashx'),
  ('assan-panel-smartcore-sandwich-panels', 'https://www.assanpanel.com/-/media/images/urunler/sandvic-paneller/smartcore/2024/03/smartcore-n5.ashx'),
  ('assan-panel-roof-panels', 'https://www.assanpanel.com/-/media/images/urunler/sandvic-paneller/cati-panelleri/2024/05/31/hibrit-panel-v2.ashx'),
  ('assan-panel-facade-panels', 'https://www.assanpanel.com/-/media/images/urunler/sandvic-paneller/cephe-panelleri/2024/04/17/wdw-1.ashx'),
  ('assan-panel-trapezoidal-sheets', 'https://www.assanpanel.com/-/media/images/urunler/trapezler/38-151-6-trapez/38-151-6-1-1.ashx'),
  ('assan-panel-polycarbonate-sheet', 'https://www.assanpanel.com/-/media/images/urunler/polikarbonat-levha/p965-duz-polikarbonat/p965.ashx'),
  ('assan-panel-insulation-group', 'https://www.assanpanel.com/-/media/images/urunler/yalitim-grubu/assanboard/2024/09/assanboard-gorsel.ashx'),
  ('novawood-thermowood-solid-parquet', 'https://novawood.com/uploads/cookshop-2019-thermo-s-disbudak-masif-parke-3-01.webp'),
  ('novawood-thermowood-decking', 'https://novawood.com/uploads/novawood-israel-2020-tmt-iroko-deck-cephe-pergola-22.webp'),
  ('novawood-thermowood-cladding', 'https://novawood.com/uploads/exterior-01.webp'),
  ('geberit-toilets-and-urinals', 'https://www.geberit.com.tr/_assetsmaster/global-media/pictures/badezimmersysteme/wc-system/geb-group-wc-system-keyvisual-header-1170x439px-b2c-stolz-72dpi-original-1-1600-900.jpg'),
  ('geberit-shower-solutions', 'https://www.geberit.com.tr/_assetsmaster/global-media/pictures/badezimmersysteme/duschen/2021-geberit-shower-area-olona-model-1600-900.jpg'),
  ('newarc-armatur-bathroom-and-kitchen-faucets', 'https://www.newarc.com.tr/wp-content/uploads/2026/06/157511-300x300.jpg')
) as v (external_id, url)
where p.source_site in ('kompass', 'dalil')
  and p.source_external_id = v.external_id
  and cardinality(p.image_urls) = 0;
