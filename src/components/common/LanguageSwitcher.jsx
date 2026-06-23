import React from "react";
import { useTranslation } from "react-i18next";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

export default function LanguageSwitcher({ showLabel = false }) {
    const { i18n } = useTranslation();

    const changeLanguage = (lng) => {
        i18n.changeLanguage(lng);
    };

    const currentLanguage = i18n.language === 'vi'
        ? { flag: '/vietnam.png', alt: 'Vietnam Flag', label: 'Tiếng Việt' }
        : { flag: '/england.png', alt: 'England Flag', label: 'English' };

    // Get current language flag
    const getCurrentFlag = () => {
        return (
            <img
                src={currentLanguage.flag}
                alt={currentLanguage.alt}
                className="h-5 w-auto object-contain rounded-sm"
            />
        );
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size={showLabel ? "default" : "icon"} className={showLabel ? "h-9 gap-2 px-3" : "h-8 w-8"}>
                    {getCurrentFlag()}
                    {showLabel && <span className="text-sm font-medium">{currentLanguage.label}</span>}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuItem
                    onClick={() => changeLanguage('vi')}
                    className={i18n.language === 'vi' ? 'bg-accent' : ''}
                >
                    🇻🇳 Tiếng Việt
                </DropdownMenuItem>
                <DropdownMenuItem
                    onClick={() => changeLanguage('en')}
                    className={i18n.language === 'en' ? 'bg-accent' : ''}
                >
                    🇬🇧 English
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
