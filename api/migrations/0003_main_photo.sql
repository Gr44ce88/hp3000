-- Главное фото анкеты: показывается в каталоге, остальные — в галерее.

alter table hookers add column main_photo text not null default '';
