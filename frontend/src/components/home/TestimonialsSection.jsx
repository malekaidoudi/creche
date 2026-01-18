/**
 * Section Témoignages pour la page d'accueil
 * Affiche les témoignages approuvés des parents
 */

import { useState, useEffect } from 'react';
import { Star, Quote, ChevronLeft, ChevronRight, MessageCircle, PenLine } from 'lucide-react';
import { useLanguage } from '../../hooks/useLanguage';
import { useTheme } from '../../hooks/useTheme';
import { useAuth } from '../../hooks/useAuth';
import api from '../../services/api';
import TestimonialForm from '../testimonials/TestimonialForm';

const TestimonialsSection = () => {
    const { isRTL } = useLanguage();
    const { isDark } = useTheme();
    const { isAuthenticated, user } = useAuth();
    const [testimonials, setTestimonials] = useState([]);
    const [stats, setStats] = useState({ total_approved: 0, average_rating: 0 });
    const [currentIndex, setCurrentIndex] = useState(0);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);

    const isParent = user?.role === 'parent';

    useEffect(() => {
        fetchTestimonials();
        fetchStats();
    }, []);

    const fetchTestimonials = async () => {
        try {
            const response = await api.get('/api/testimonials/approved?limit=10');
            if (response.data.success) {
                setTestimonials(response.data.testimonials);
            }
        } catch (error) {
            console.error('Erreur chargement témoignages:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchStats = async () => {
        try {
            const response = await api.get('/api/testimonials/stats');
            if (response.data.success) {
                setStats(response.data.stats);
            }
        } catch (error) {
            console.error('Erreur chargement stats:', error);
        }
    };

    const nextTestimonial = () => {
        setCurrentIndex((prev) => (prev + 1) % testimonials.length);
    };

    const prevTestimonial = () => {
        setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
    };

    const renderStars = (rating) => {
        return (
            <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                        key={star}
                        className={`w-5 h-5 ${star <= rating
                            ? 'text-yellow-400 fill-yellow-400'
                            : 'text-gray-300 dark:text-gray-600'
                            }`}
                    />
                ))}
            </div>
        );
    };

    const getInitials = (name) => {
        return name
            .split(' ')
            .map((n) => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    // Ne pas afficher la section s'il n'y a pas de témoignages ET que l'utilisateur n'est pas un parent connecté
    if (!loading && testimonials.length === 0 && !isParent) {
        return null;
    }

    return (
        <section className="py-20 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="text-center mb-12">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 mb-4">
                        <MessageCircle className="w-8 h-8 text-white" />
                    </div>
                    <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
                        {isRTL ? 'آراء أولياء الأمور' : 'Ce que disent les parents'}
                    </h2>
                    <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
                        {isRTL
                            ? 'اكتشفوا تجارب العائلات التي وثقت بنا'
                            : 'Découvrez les expériences des familles qui nous ont fait confiance'}
                    </p>

                    {/* Stats */}
                    {stats.total_approved > 0 && (
                        <div className="flex items-center justify-center gap-6 mt-6">
                            <div className="flex items-center gap-2">
                                <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                                    {stats.total_approved}
                                </span>
                                <span className="text-gray-600 dark:text-gray-400">
                                    {isRTL ? 'تقييم' : 'avis'}
                                </span>
                            </div>
                            {stats.average_rating && (
                                <div className="flex items-center gap-2">
                                    <Star className="w-6 h-6 text-yellow-400 fill-yellow-400" />
                                    <span className="text-2xl font-bold text-gray-900 dark:text-white">
                                        {parseFloat(stats.average_rating).toFixed(1)}
                                    </span>
                                    <span className="text-gray-600 dark:text-gray-400">/5</span>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Loading state */}
                {loading ? (
                    <div className="flex justify-center">
                        <div className="animate-pulse flex flex-col items-center">
                            <div className="w-20 h-20 bg-gray-300 dark:bg-gray-700 rounded-full mb-4"></div>
                            <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-48 mb-2"></div>
                            <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-64"></div>
                        </div>
                    </div>
                ) : (
                    <>
                        {/* Carousel pour mobile */}
                        <div className="md:hidden relative">
                            {testimonials.length > 0 && (
                                <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-xl">
                                    <Quote className="w-10 h-10 text-blue-500/20 dark:text-blue-400/20 mb-4" />

                                    <p className="text-gray-700 dark:text-gray-300 text-lg mb-6 leading-relaxed">
                                        "{testimonials[currentIndex].content}"
                                    </p>

                                    <div className="flex items-center gap-4">
                                        {testimonials[currentIndex].parent_image ? (
                                            <img
                                                src={testimonials[currentIndex].parent_image}
                                                alt={testimonials[currentIndex].parent_name}
                                                className="w-14 h-14 rounded-full object-cover border-2 border-blue-500"
                                            />
                                        ) : (
                                            <div className="w-14 h-14 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-lg">
                                                {getInitials(testimonials[currentIndex].parent_name)}
                                            </div>
                                        )}
                                        <div>
                                            <h4 className="font-semibold text-gray-900 dark:text-white">
                                                {testimonials[currentIndex].parent_name}
                                            </h4>
                                            {testimonials[currentIndex].child_name && (
                                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                                    {isRTL ? 'والد/ة' : 'Parent de'} {testimonials[currentIndex].child_name}
                                                </p>
                                            )}
                                            {renderStars(testimonials[currentIndex].rating)}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Navigation mobile */}
                            {testimonials.length > 1 && (
                                <div className="flex justify-center gap-4 mt-6">
                                    <button
                                        onClick={prevTestimonial}
                                        className="p-2 rounded-full bg-white dark:bg-gray-800 shadow-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                                    >
                                        <ChevronLeft className="w-6 h-6 text-gray-600 dark:text-gray-300" />
                                    </button>
                                    <div className="flex items-center gap-2">
                                        {testimonials.map((_, idx) => (
                                            <button
                                                key={idx}
                                                onClick={() => setCurrentIndex(idx)}
                                                className={`w-2 h-2 rounded-full transition-all ${idx === currentIndex
                                                    ? 'bg-blue-500 w-6'
                                                    : 'bg-gray-300 dark:bg-gray-600'
                                                    }`}
                                            />
                                        ))}
                                    </div>
                                    <button
                                        onClick={nextTestimonial}
                                        className="p-2 rounded-full bg-white dark:bg-gray-800 shadow-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                                    >
                                        <ChevronRight className="w-6 h-6 text-gray-600 dark:text-gray-300" />
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Grille pour desktop */}
                        <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {testimonials.slice(0, 6).map((testimonial, index) => (
                                <div
                                    key={testimonial.id}
                                    className={`bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 ${testimonial.is_featured ? 'ring-2 ring-blue-500 ring-offset-2 dark:ring-offset-gray-900' : ''
                                        }`}
                                >
                                    {testimonial.is_featured && (
                                        <div className="absolute -top-2 -right-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white text-xs px-2 py-1 rounded-full">
                                            ⭐ {isRTL ? 'مميز' : 'Mis en avant'}
                                        </div>
                                    )}

                                    <Quote className="w-8 h-8 text-blue-500/20 dark:text-blue-400/20 mb-3" />

                                    <p className="text-gray-700 dark:text-gray-300 mb-4 line-clamp-4">
                                        "{testimonial.content}"
                                    </p>

                                    <div className="flex items-center gap-3 mt-auto">
                                        {testimonial.parent_image ? (
                                            <img
                                                src={testimonial.parent_image}
                                                alt={testimonial.parent_name}
                                                className="w-12 h-12 rounded-full object-cover border-2 border-blue-500"
                                            />
                                        ) : (
                                            <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold">
                                                {getInitials(testimonial.parent_name)}
                                            </div>
                                        )}
                                        <div className="flex-1 min-w-0">
                                            <h4 className="font-semibold text-gray-900 dark:text-white truncate">
                                                {testimonial.parent_name}
                                            </h4>
                                            {testimonial.child_name && (
                                                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                                    {isRTL ? 'والد/ة' : 'Parent de'} {testimonial.child_name}
                                                </p>
                                            )}
                                        </div>
                                        <div className="flex-shrink-0">
                                            {renderStars(testimonial.rating)}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                )}

                {/* Bouton pour les parents connectés - toujours visible */}
                {isAuthenticated && isParent && (
                    <div className="text-center mt-10">
                        <button
                            onClick={() => setShowForm(true)}
                            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white font-medium rounded-xl hover:from-blue-600 hover:to-purple-600 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                        >
                            <PenLine className="w-5 h-5" />
                            {isRTL ? 'شاركنا رأيك' : 'Partagez votre avis'}
                        </button>
                    </div>
                )}
            </div>

            {/* Modal formulaire témoignage */}
            <TestimonialForm
                isOpen={showForm}
                onClose={() => setShowForm(false)}
                onSuccess={fetchTestimonials}
            />
        </section>
    );
};

export default TestimonialsSection;
