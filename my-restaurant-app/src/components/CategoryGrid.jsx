import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from "@/components/ui/card";

const categories = [
    {
        id: 'sweet',
        title: 'Сладки палачинки',
        image: '/cover_sweet_pancake.jpeg',
        link: '/food'
    },
    {
        id: 'american',
        title: 'Американски палачинки',
        image: '/cover_american_sweet_pancake.jpeg',
        link: '/food'
    },
    {
        id: 'savory',
        title: 'Солени палачинки',
        image: '/cover_sour_pancake.jpeg',
        link: '/food'
    },
    {
        id: 'deluxe',
        title: 'Делукс кутии',
        image: '/cover_deluxe_box.jpeg',
        link: '/food'
    }
];

export function CategoryGrid() {
    return (
        <section className="container mx-auto px-4 py-12">
            <h2 className="text-3xl font-bold text-center mb-8">Нашето Меню</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {categories.map((category) => (
                    <Link key={category.id} to={category.link} className="group">
                        <Card className="overflow-hidden border-none shadow-lg transition-transform duration-300 group-hover:scale-105">
                            <CardContent className="p-0 relative aspect-[4/5]">
                                <img
                                    src={category.image}
                                    alt={category.title}
                                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-6">
                                    <h3 className="text-white text-xl font-bold text-center">{category.title}</h3>
                                </div>
                            </CardContent>
                        </Card>
                    </Link>
                ))}
            </div>
        </section>
    );
}
