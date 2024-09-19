import { I18n } from "i18n-js";
import { useState } from "react";
import en from './locales/en.json';
import fa from './locales/fa.json';
import { useSetLocale } from "../socketContext";

const useTranslate = () => {
    const {locale,setLocale} = useSetLocale();
    // let [locale, setLocale] = useState<'en' | 'fa'>('fa');

    const i18n = new I18n({
        en,
        fa,
    });
    i18n.enableFallback = true;
    i18n.translations = { en, fa };
    i18n.locale = locale;
    return { i18n, locale, setLocale }
}

export { useTranslate };
