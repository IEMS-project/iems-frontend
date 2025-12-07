import React from "react";
import { useTranslation } from "react-i18next";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

export default function LanguageSwitcher() {
    const { i18n } = useTranslation();

    const changeLanguage = (lng) => {
        i18n.changeLanguage(lng);
    };

    // Get current language flag
    const getCurrentFlag = () => {
        const flagSrc = i18n.language === 'vi' ? '/vietnam.png' : '/england.png';
        const altText = i18n.language === 'vi' ? 'Vietnam Flag' : 'England Flag';
        
        return (
            <img 
                src={flagSrc} 
                alt={altText}
                className="h-5 w-auto object-contain rounded-sm"
            />
        );
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                    {getCurrentFlag()}
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
