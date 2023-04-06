import DropdownInput, { DropdownOption } from 'components/DropdownInput';
import { Language } from 'constants/locale';
import { useLocalState } from 'hooks/useLocalState';
import { t } from 'i18next';
import { useRouter } from 'next/router';
import { getBestPossibleUserLocale } from 'utils/i18n';
import { LS_KEYS } from 'utils/storage/localStorage';

const getLocaleDisplayName = (l: Language) => {
    switch (l) {
        case Language.en:
            return 'English';
        case Language.fr:
            return 'Français';
    }
};

const getLanguageOptions = (): DropdownOption<Language>[] => {
    return Object.values(Language).map((lang) => ({
        label: getLocaleDisplayName(lang),
        value: lang,
    }));
};

export const LanguageSelector = () => {
    const [userLocale, setUserLocale] = useLocalState(
        LS_KEYS.LOCALE,
        getBestPossibleUserLocale()
    );

    const router = useRouter();

    const updateCurrentLocale = (newLocale: Language) => {
        setUserLocale(newLocale);
        router.reload();
    };

    return (
        <DropdownInput
            options={getLanguageOptions()}
            label={t('LANGUAGE')}
            labelProps={{ color: 'text.secondary' }}
            selected={userLocale}
            setSelected={updateCurrentLocale}
        />
    );
};
