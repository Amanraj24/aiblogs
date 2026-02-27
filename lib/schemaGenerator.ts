import { BlogPost } from '../types';

export const generateBlogPostingSchema = (post: BlogPost) => {
    return {
        "@type": "BlogPosting",
        "headline": post.title,
        "description": post.excerpt,
        "image": post.coverImage,
        "author": {
            "@type": "Person",
            "name": "AutoBlog AI",
            "jobTitle": "AI Content Creator",
            "worksFor": {
                "@type": "Organization",
                "name": "AutoBlog"
            }
        },
        "publisher": {
            "@type": "Organization",
            "name": "AutoBlog",
            "logo": {
                "@type": "ImageObject",
                "url": "https://smmsurge.com/logo.png" // Fallback logo
            }
        },
        "datePublished": post.dateCreated,
        "dateModified": new Date().toISOString(), // Use current for now, or post.dateModified if added
        "mainEntityOfPage": {
            "@type": "WebPage",
            "@id": `https://smmsurge.com/blog/${post.slug}`
        }
    };
};

export const generateOrganizationSchema = () => {
    return {
        "@type": "Organization",
        "name": "AutoBlog AI",
        "url": "https://smmsurge.com",
        "logo": "https://smmsurge.com/logo.png",
        "sameAs": [
            "https://twitter.com/autoblogai",
            "https://facebook.com/autoblogai",
            "https://linkedin.com/company/autoblogai"
        ],
        "contactPoint": {
            "@type": "ContactPoint",
            "telephone": "+1-000-000-0000",
            "contactType": "customer service"
        }
    };
};

export const generateBreadcrumbSchema = (post: BlogPost) => {
    return {
        "@type": "BreadcrumbList",
        "itemListElement": [
            {
                "@type": "ListItem",
                "position": 1,
                "name": "Home",
                "item": "https://smmsurge.com"
            },
            {
                "@type": "ListItem",
                "position": 2,
                "name": "Blog",
                "item": "https://smmsurge.com/blog"
            },
            {
                "@type": "ListItem",
                "position": 3,
                "name": post.category,
                "item": `https://smmsurge.com/blog/category/${post.category.toLowerCase().replace(/\s+/g, '-')}`
            },
            {
                "@type": "ListItem",
                "position": 4,
                "name": post.title,
                "item": `https://smmsurge.com/blog/${post.slug}`
            }
        ]
    };
};

export const generateFAQSchema = (post: BlogPost) => {
    if (!post.aeoQuestions || post.aeoQuestions.length === 0) return null;

    return {
        "@type": "FAQPage",
        "mainEntity": post.aeoQuestions.map(q => ({
            "@type": "Question",
            "name": q.question,
            "acceptedAnswer": {
                "@type": "Answer",
                "text": q.answer
            }
        }))
    };
};

export const generateHowToSchema = (post: BlogPost) => {
    if (!post.isHowTo || !post.steps || post.steps.length < 3) return null;

    return {
        "@type": "HowTo",
        "name": post.title,
        "description": post.excerpt,
        "step": post.steps.map((step, idx) => ({
            "@type": "HowToStep",
            "position": idx + 1,
            "text": step,
            "name": `Step ${idx + 1}`
        }))
    };
};

export const generateServiceSchema = (post: BlogPost) => {
    if (!post.commercialIntent) return null;

    return {
        "@type": "Service",
        "name": post.title,
        "provider": {
            "@type": "Organization",
            "name": "AutoBlog AI"
        },
        "areaServed": post.geoTargeting || "Global",
        "hasOfferCatalog": {
            "@type": "OfferCatalog",
            "name": "Social Media Services",
            "itemListElement": [
                {
                    "@type": "Offer",
                    "itemOffered": {
                        "@type": "Service",
                        "name": post.title
                    },
                    "price": "1.00",
                    "priceCurrency": "USD"
                }
            ]
        }
    };
};

export const aggregateSchemas = (post: BlogPost) => {
    const schemas: any[] = [
        {
            "@context": "https://schema.org",
            ...generateBlogPostingSchema(post)
        },
        {
            "@context": "https://schema.org",
            ...generateOrganizationSchema()
        },
        {
            "@context": "https://schema.org",
            ...generateBreadcrumbSchema(post)
        }
    ];

    const faq = generateFAQSchema(post);
    if (faq) schemas.push({ "@context": "https://schema.org", ...faq });

    const howTo = generateHowToSchema(post);
    if (howTo) schemas.push({ "@context": "https://schema.org", ...howTo });

    const service = generateServiceSchema(post);
    if (service) schemas.push({ "@context": "https://schema.org", ...service });

    return schemas;
};

export const getCombinedSchemaHtml = (post: BlogPost) => {
    const schemas = aggregateSchemas(post);
    return schemas.map(schema =>
        `<script type="application/ld+json">${JSON.stringify(schema, null, 2)}</script>`
    ).join('\n');
};
