UPDATE component_offers co
SET product_url = CASE co.store_name
                      WHEN 'COMFY' THEN 'https://comfy.ua/ua/search/?q='
                      ELSE 'https://rozetka.com.ua/ua/search/?text='
                      END || REGEXP_REPLACE(
                          REPLACE(
                                  REPLACE(
                                          REPLACE(
                                                  REPLACE(
                                                          REPLACE(
                                                                  REPLACE(c.name, ' ГБ', 'GB'),
                                                                  ' ТБ', 'TB'),
                                                          ' ядра', 'cores'),
                                                  ' ядер', 'cores'),
                                          ' вент.', 'fans'),
                                  ' ', '+'),
                          '[^a-zA-Z0-9+._-]', '', 'g'
                             )
    FROM components c
WHERE co.component_id = c.id;

UPDATE components c
SET shop_url = o.product_url
    FROM component_offers o
WHERE o.component_id = c.id
  AND o.store_name = c.store_name;