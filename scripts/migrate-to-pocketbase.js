const { createPocketBase, COLLECTIONS } = require('../src/lib/pocketbase.ts')

/**
 * Migration script to transfer all current site data to PocketBase
 * Run with: node scripts/migrate-to-pocketbase.js
 */

// Current site data to migrate
const SITE_CONTENT_DATA = [
	// Home page content
	{
		page: 'home',
		section: 'hero',
		key: 'main_title',
		title: 'Main Title',
		content: 'Espérance Masson, autrice française de dark romance',
		order: 1,
		is_active: true,
	},
	{
		page: 'home',
		section: 'hero',
		key: 'main_description',
		title: 'Main Description',
		content:
			"Bienvenue dans l'univers sombre et passionné d'Espérance Masson. Autrice française spécialisée dans la dark romance, j'écris des histoires d'âmes tourmentées, d'amours impossibles et de la part d'ombre qui sommeille en chacun de nous.",
		order: 2,
		is_active: true,
	},
	{
		page: 'home',
		section: 'book',
		key: 'book_title',
		title: 'Book Title',
		content: 'Cœurs Sombres - Dark Romance Wattpad',
		order: 1,
		is_active: true,
	},
	{
		page: 'home',
		section: 'book',
		key: 'book_description',
		title: 'Book Description',
		content:
			"Fuyant un passé qui la hante, Angèle rêve de reprendre le contrôle de sa vie et part avec sa meilleure amie aux États-Unis pour tout recommencer. Mais sa quête de liberté vire au cauchemar lorsqu'elle tombe sous l'emprise de Lucas Ferrari, un chef de mafia aussi froid qu'impitoyable, prêt à tout pour assouvir une vengeance qui le consume.",
		order: 2,
		is_active: true,
	},
	{
		page: 'home',
		section: 'book',
		key: 'book_description_2',
		title: 'Book Description 2',
		content:
			"Cette dark romance française explore les thèmes de l'enemies to lovers et de la mafia romance. Pris dans un jeu de pouvoir et de manipulation, Angèle et Lucas découvrent qu'ils sont liés par des secrets capables de tout détruire.",
		order: 3,
		is_active: true,
	},
	{
		page: 'home',
		section: 'book',
		key: 'book_description_3',
		title: 'Book Description 3',
		content:
			'Entre haine et attirance, leur lutte pour survivre pourrait bien les mener à leur perte. Cette romance française intense captive les lecteurs Wattpad avec ses personnages complexes et son intrigue haletante. Succomberont-ils aux ténèbres du désir ou trouveront-ils enfin la paix au prix de leur âme ?',
		order: 4,
		is_active: true,
	},
	{
		page: 'home',
		section: 'book',
		key: 'rankings_title',
		title: 'Rankings Title',
		content: 'Succès Wattpad - Classements #1',
		order: 5,
		is_active: true,
	},
	{
		page: 'home',
		section: 'book',
		key: 'wattpad_button',
		title: 'Wattpad Button',
		content: 'Lire Cœurs Sombres gratuitement sur Wattpad',
		order: 6,
		is_active: true,
	},

	// About page content
	{
		page: 'about',
		section: 'hero',
		key: 'main_title',
		title: 'Main Title',
		content: 'Je suis Espérance Masson, autrice française de dark romance',
		order: 1,
		is_active: true,
	},
	{
		page: 'about',
		section: 'hero',
		key: 'greeting',
		title: 'Greeting',
		content: "Salut tout le monde ! J'espère que vous allez bien.",
		order: 2,
		is_active: true,
	},
	{
		page: 'about',
		section: 'hero',
		key: 'biography_1',
		title: 'Biography 1',
		content:
			"Bienvenue dans mon univers où j'explore les profondeurs de l'âme humaine à travers des dark romances françaises, intenses et captivantes. En tant qu'autrice française spécialisée dans la romance sombre, je crée des histoires qui questionnent les limites entre l'amour et l'obsession.",
		order: 3,
		is_active: true,
	},
	{
		page: 'about',
		section: 'hero',
		key: 'biography_2',
		title: 'Biography 2',
		content:
			'Mon roman "Cœurs Sombres" a conquis plus de lecteurs sur Wattpad et atteint la première place dans plusieurs catégories. Cette enemies to lovers mafia romance suit l\'histoire troublante d\'Angèle et Lucas Ferrari, deux âmes brisées liées par des secrets destructeurs.',
		order: 4,
		is_active: true,
	},
	{
		page: 'about',
		section: 'hero',
		key: 'biography_3',
		title: 'Biography 3',
		content:
			"N'hésitez pas à venir me retrouver sur mes réseaux sociaux (@esp_masson sur Instagram, @_esperance_masson sur TikTok) pour découvrir les coulisses de l'écriture de mes romans et échanger avec d'autres passionnés de dark romance française.",
		order: 5,
		is_active: true,
	},
	{
		page: 'about',
		section: 'book',
		key: 'book_title',
		title: 'Book Title',
		content: 'Cœurs Sombres - Mon premier roman Wattpad',
		order: 1,
		is_active: true,
	},
	{
		page: 'about',
		section: 'book',
		key: 'book_description_1',
		title: 'Book Description 1',
		content:
			"Cœurs Sombres est né d'une passion pour les histoires complexes où l'amour et la violence s'entremêlent dans une dark romance française captivante.",
		order: 2,
		is_active: true,
	},
	{
		page: 'about',
		section: 'book',
		key: 'book_description_2',
		title: 'Book Description 2',
		content:
			"Cette dark romance explore les zones grises de l'âme humaine, là où la rédemption et la destruction se côtoient dans un équilibre fragile. L'histoire d'Angèle et Lucas Ferrari plonge les lecteurs dans un univers de mafia romance où l'enemies to lovers prend une dimension particulièrement intense.",
		order: 3,
		is_active: true,
	},
	{
		page: 'about',
		section: 'book',
		key: 'book_description_3',
		title: 'Book Description 3',
		content:
			'Disponible gratuitement sur Wattpad, ce livre a déjà conquis plus de lecteurs et obtenu plusieurs classements #1 dans les catégories enemies to lovers, trahisons, meurtres et amitiés.',
		order: 4,
		is_active: true,
	},
	{
		page: 'about',
		section: 'book',
		key: 'book_description_4',
		title: 'Book Description 4',
		content:
			"Suivez-moi : @esp_masson sur Instagram et @_esperance_masson sur TikTok pour découvrir les coulisses de l'écriture et mes prochains projets de dark romance.",
		order: 5,
		is_active: true,
	},

	// 404 page content
	{
		page: '404',
		section: 'error',
		key: 'title',
		title: 'Error Title',
		content: 'Page not found',
		order: 1,
		is_active: true,
	},
	{
		page: '404',
		section: 'error',
		key: 'description',
		title: 'Error Description',
		content: "Sorry, we couldn't find the page you're looking for.",
		order: 2,
		is_active: true,
	},
	{
		page: '404',
		section: 'error',
		key: 'button',
		title: 'Error Button',
		content: 'Go back home',
		order: 3,
		is_active: true,
	},
]

const SEO_METADATA_DATA = [
	{
		page: 'home',
		title: 'Accueil - Espérance Masson | Autrice de Cœurs Sombres',
		description:
			'Découvrez l\'univers sombre et passionné d\'Espérance Masson. Lisez "Cœurs Sombres", son premier roman dark romance sur Wattpad qui captive plus de 85k+ lecteurs.',
		keywords: [
			'Cœurs Sombres Wattpad',
			'Lucas Ferrari',
			'Angèle roman',
			'dark romance française',
			'enemies to lovers français',
			'mafia romance Wattpad',
			'roman passion sombre',
			'autrice française Wattpad',
			'livre gratuit Wattpad',
			'romance française 2025',
		],
		og_title: 'Espérance Masson - Autrice Dark Romance | Cœurs Sombres Wattpad',
		og_description:
			'Plongez dans l\'univers dark romance d\'Espérance Masson. "Cœurs Sombres" - Son premier roman dark romance sur Wattpad.',
		og_url: 'https://esperancem.fr',
		twitter_title: 'Espérance Masson - Autrice de Dark Romance | Cœurs Sombres',
		twitter_description:
			'Découvrez l\'univers d\'Espérance Masson, autrice française de dark romance. "Cœurs Sombres" - sur Wattpad avec plus de 85k+ lectures.',
		twitter_creator: '@esp_masson',
		twitter_site: '@esp_masson',
		is_active: true,
	},
	{
		page: 'about',
		title: "À propos d'Espérance Masson - Autrice Dark Romance | Cœurs Sombres",
		description:
			'Découvrez Espérance Masson, autrice française passionnée de dark romance. Créatrice du roman "Cœurs Sombres" sur Wattpad, elle explore les profondeurs de l\'âme humaine à travers des histoires intenses et captivantes.',
		keywords: [
			'Espérance Masson biographie',
			'autrice française dark romance',
			'esp_masson Instagram',
			'écrivaine française Wattpad',
			'auteure Cœurs Sombres',
			'romancière française',
			'dark romance France',
			'@_esperance_masson TikTok',
			'autrice française 2025',
			'écrivaine romance sombre',
			'littérature française contemporaine',
			'romance française indépendante',
		],
		og_title: "À propos d'Espérance Masson - Autrice de Cœurs Sombres",
		og_description:
			'Rencontrez Espérance Masson, l\'autrice derrière le roman "Cœurs Sombres". Une plume française qui excelle dans la dark romance avec plus de 85k+ lecteurs.',
		og_url: 'https://esperancem.fr/about',
		twitter_title: "À propos d'Espérance Masson - Autrice de Dark Romance",
		twitter_description:
			'Rencontrez Espérance Masson, l\'autrice derrière "Cœurs Sombres". Dark romance française avec plus de 85k+ lecteurs sur Wattpad.',
		twitter_creator: '@esp_masson',
		twitter_site: '@esp_masson',
		is_active: true,
	},
	{
		page: 'layout',
		title: 'Espérance Masson - Autrice de Dark Romance | Cœurs Sombres',
		description:
			'Site officiel d\'Espérance Masson, autrice française de dark romance. Découvrez "Cœurs Sombres", son premier roman sur Wattpad avec plus de 85k+ lectures. Dark romance, enemies to lovers, mafia romance.',
		keywords: [
			'Espérance Masson',
			'autrice française',
			'dark romance',
			'Cœurs Sombres',
			'Wattpad',
			'roman français',
			'enemies to lovers',
			'mafia romance',
			'romance sombre',
			'livre français',
			'auteure dark romance',
			'esp_masson',
			'Lucas Ferrari',
			'Angèle',
			'romance française',
			'littérature française contemporaine',
		],
		og_title: 'Espérance Masson - Autrice de Dark Romance | Cœurs Sombres',
		og_description:
			'Découvrez l\'univers d\'Espérance Masson, autrice française de dark romance. "Cœurs Sombres" - sur Wattpad avec plus de 85k+ lectures.',
		og_url: 'https://esperancem.fr',
		twitter_title: 'Espérance Masson - Autrice de Dark Romance | Cœurs Sombres',
		twitter_description:
			'Découvrez l\'univers d\'Espérance Masson, autrice française de dark romance. "Cœurs Sombres" - son premier roman sur Wattpad avec plus de 85k+ lectures.',
		twitter_creator: '@esp_masson',
		twitter_site: '@esp_masson',
		is_active: true,
	},
]

const SOCIAL_LINKS_DATA = [
	{
		platform: 'instagram',
		display_name: 'Instagram',
		username: 'esp_masson',
		url: 'https://www.instagram.com/esp_masson/',
		icon: 'InstagramIcon',
		is_active: true,
		order: 1,
	},
	{
		platform: 'tiktok',
		display_name: 'TikTok',
		username: '_esperance_masson',
		url: 'https://www.tiktok.com/@_esperance_masson',
		icon: 'TikTokIcon',
		is_active: true,
		order: 2,
	},
	{
		platform: 'wattpad',
		display_name: 'Wattpad',
		username: 'Esperancem',
		url: 'https://www.wattpad.com/user/Esperancem',
		icon: 'WattpadIcon',
		is_active: true,
		order: 3,
	},
	{
		platform: 'email',
		display_name: 'Email',
		username: 'esperance.masson@gmail.com',
		url: 'mailto:esperance.masson@gmail.com',
		icon: 'MailIcon',
		is_active: true,
		order: 4,
	},
]

const WATTPAD_RANKINGS_DATA = [
	{
		category: 'ennemiestolovers',
		position: 1,
		date: '2025-04-24',
		is_active: true,
	},
	{
		category: 'amitiés',
		position: 1,
		date: '2025-04-28',
		is_active: true,
	},
	{
		category: 'trahisons',
		position: 1,
		date: '2025-05-26',
		is_active: true,
	},
	{
		category: 'meurtres',
		position: 1,
		date: '2025-05-30',
		is_active: true,
	},
	{
		category: 'crimes',
		position: 1,
		date: '2025-06-08',
		is_active: true,
	},
	{
		category: 'proximitée forcée',
		position: 1,
		date: '2025-06-16',
		is_active: true,
	},
]

const SITE_SETTINGS_DATA = [
	{
		key: 'site_name',
		value: 'Espérance Masson - Autrice',
		type: 'string',
		description: 'Nom du site',
		is_active: true,
	},
	{
		key: 'author_name',
		value: 'Espérance Masson',
		type: 'string',
		description: "Nom de l'autrice",
		is_active: true,
	},
	{
		key: 'base_url',
		value: 'https://esperancem.fr',
		type: 'string',
		description: 'URL de base du site',
		is_active: true,
	},
	{
		key: 'copyright_text',
		value: '© {year} Espérance masson',
		type: 'string',
		description: 'Texte de copyright',
		is_active: true,
	},
	{
		key: 'footer_credit',
		value: 'Made with ♡ by Cinquin Andy',
		type: 'string',
		description: 'Crédit du footer',
		is_active: true,
	},
]

async function migrateData() {
	console.log('🚀 Starting migration to PocketBase...')

	const pb = createPocketBase()

	try {
		// Migrate site content
		console.log('\n📝 Migrating site content...')
		for (const content of SITE_CONTENT_DATA) {
			try {
				await pb.collection(COLLECTIONS.SITE_CONTENT).create(content)
				console.log(
					`✅ Created content: ${content.page}/${content.section}/${content.key}`
				)
			} catch (error) {
				if (error.message.includes('duplicate')) {
					console.log(
						`⚠️  Content already exists: ${content.page}/${content.section}/${content.key}`
					)
				} else {
					console.error(
						`❌ Error creating content ${content.page}/${content.section}/${content.key}:`,
						error.message
					)
				}
			}
		}

		// Migrate SEO metadata
		console.log('\n🔍 Migrating SEO metadata...')
		for (const metadata of SEO_METADATA_DATA) {
			try {
				await pb.collection(COLLECTIONS.SEO_METADATA).create(metadata)
				console.log(`✅ Created SEO metadata for: ${metadata.page}`)
			} catch (error) {
				if (error.message.includes('duplicate')) {
					console.log(`⚠️  SEO metadata already exists for: ${metadata.page}`)
				} else {
					console.error(
						`❌ Error creating SEO metadata for ${metadata.page}:`,
						error.message
					)
				}
			}
		}

		// Migrate social links
		console.log('\n🔗 Migrating social links...')
		for (const link of SOCIAL_LINKS_DATA) {
			try {
				await pb.collection(COLLECTIONS.SOCIAL_LINKS).create(link)
				console.log(`✅ Created social link: ${link.platform}`)
			} catch (error) {
				if (error.message.includes('duplicate')) {
					console.log(`⚠️  Social link already exists: ${link.platform}`)
				} else {
					console.error(
						`❌ Error creating social link ${link.platform}:`,
						error.message
					)
				}
			}
		}

		// Migrate Wattpad rankings
		console.log('\n🏆 Migrating Wattpad rankings...')
		for (const ranking of WATTPAD_RANKINGS_DATA) {
			try {
				await pb.collection(COLLECTIONS.WATTPAD_RANKINGS).create(ranking)
				console.log(
					`✅ Created ranking: ${ranking.category} #${ranking.position}`
				)
			} catch (error) {
				if (error.message.includes('duplicate')) {
					console.log(
						`⚠️  Ranking already exists: ${ranking.category} #${ranking.position}`
					)
				} else {
					console.error(
						`❌ Error creating ranking ${ranking.category}:`,
						error.message
					)
				}
			}
		}

		// Migrate site settings
		console.log('\n⚙️  Migrating site settings...')
		for (const setting of SITE_SETTINGS_DATA) {
			try {
				await pb.collection(COLLECTIONS.SITE_SETTINGS).create(setting)
				console.log(`✅ Created setting: ${setting.key}`)
			} catch (error) {
				if (error.message.includes('duplicate')) {
					console.log(`⚠️  Setting already exists: ${setting.key}`)
				} else {
					console.error(
						`❌ Error creating setting ${setting.key}:`,
						error.message
					)
				}
			}
		}

		console.log('\n🎉 Migration completed successfully!')
	} catch (error) {
		console.error('❌ Migration failed:', error.message)
		process.exit(1)
	}
}

// Run migration
migrateData()
