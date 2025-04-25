const BASE_URL = import.meta.env.VITE_LOCALHOST

class API {
    static async fetchTexture(materialId) {
        const response = await fetch(`${BASE_URL}/api/materialId/${materialId}`);
        if (!response.ok) {
            throw new Error('Failed to fetch texture data');
        }
        return response.json();
    }

    static async fetchTextureValue(textureId) {
        const response = await fetch(`${BASE_URL}/api/textureId/${textureId}`);
        if (!response.ok) {
            throw new Error('Failed to fetch texture value');
        }
        return response.json();
    }

    static async materialData(itemId, hash) {
        const response = await fetch(`${BASE_URL}/api/material?materialId=${encodeURIComponent(itemId)}&hash=${encodeURIComponent(hash)}`);
        if (!response.ok) {
            throw new Error('Failed to fetch material data');
        }
        const data = await response.json();
        return data.data;
    }

    static async loadArticleData() {
        try {
            const response = await fetch(`${BASE_URL}/api/articles`)
            if (!response.ok) {
                throw new Error('Failed to fetch article data')
            }
            this.articleData = await response.json()
            return this.articleData
        } catch (error) {
            console.error('Error loading article data:', error)
        }
    }

    static async loadPartData() {
        try {
            const response = await fetch(`${BASE_URL}/api/parts`)
            if (!response.ok) {
                throw new Error('Failed to fetch part data')
            }
            this.partData = await response.json()
            return this.partData
        } catch (error) {
            console.error('Error loading part data:', error)
        }
    }

    static async loadProfileData() {
        try {
            const response = await fetch(`${BASE_URL}/api/profiles`)
            if (!response.ok) {
                throw new Error('Failed to fetch profile data')
            }
            this.profileData = await response.json()
            return this.profileData
        } catch (error) {
            console.error('Error loading profile data:', error)
        }
    }

    static async loadItemMasterData() {
        try {
            const response = await fetch(`${BASE_URL}/api/items`)
            if (!response.ok) {
                throw new Error('Failed to fetch itemMaster data')
            }
            this.itemMasterData = await response.json()
            return this.itemMasterData
        } catch (error) {
            console.error('Error loading itemMaster data:', error)
        }
    }

    static async handleItemClick(itemId, type) {
        let response;
        if (type === 'part') {
            response = await fetch(`${BASE_URL}/api/part/${itemId}`)
            if (!response.ok) {
                throw new Error('Failed to fetch part data')
            }
        }
        if (type === 'article') {
            response = await fetch(`${BASE_URL}/api/article/${itemId}`)
            if (!response.ok) {
                throw new Error('Failed to fetch article data')
            }
        }
        if (type === 'profile') {
            response = await fetch(`${BASE_URL}/api/profile/${itemId}`)
            if (!response.ok) {
                throw new Error('Failed to fetch profile data')
            }
        }
        if (type === 'item master') {
            response = await fetch(`${BASE_URL}/api/itemsmaster/${itemId}`)
            if (!response.ok) {
                throw new Error('Failed to fetch item master data')
            }
        }

        const data = await response.json()
        return [data, type];
    }

    static async loadRALData() {
        const response = await fetch(`${BASE_URL}/api/ral`)
        if (!response.ok) {
            throw new Error('Failed to fetch RAL data')
        }
        return response.json()
    }
}

export { API }; 