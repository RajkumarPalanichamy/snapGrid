const express = require('express');
const router = express.Router();
require('dotenv').config();


// Article routes
router.get('/articles', async (req, res) => {
    try {
        const response = await fetch(`${process.env.VITE_API_URL}/api/configurator/article`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${process.env.VITE_API_BEARER_TOKEN}`,
                'Accept': 'application/json',
            },
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('API Error:', errorText);
            return res.status(response.status).json({ error: errorText });
        }

        const data = await response.json();
        res.json(data);
    } catch (error) {
        console.error('Error fetching data:', error.message);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

//Part routes
router.get('/parts', async (req, res) => {
    try {
        const response = await fetch(`${process.env.VITE_API_URL}/api/masterData/partTemplate`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${process.env.VITE_API_BEARER_TOKEN}`,
                'Accept': 'application/json',
            },
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('API Error:', errorText);
            return res.status(response.status).json({ error: errorText });
        }

        const data = await response.json();
        res.json(data);
    } catch (error) {
        console.error('Error fetching data:', error.message);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Get specific article by ID
router.get('/article/:id', async (req, res) => {
    try {
        const articleId = req.params.id;
        const response = await fetch(`${process.env.VITE_API_URL}/api/configurator/article/${articleId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${process.env.VITE_API_BEARER_TOKEN}`,
                'Accept': 'application/json',
            },
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('API Error:', errorText);
            return res.status(response.status).json({ error: errorText });
        }

        const data = await response.json();
        res.json(data);
    } catch (error) {
        console.error('Error fetching part data:', error.message);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Get specific profile by ID  
router.get('/profile/:id', async (req, res) => {
    try {
        const profileId = req.params.id;
        const response = await fetch(`${process.env.VITE_API_URL}/api/masterData/profileTemplate/${profileId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${process.env.VITE_API_BEARER_TOKEN}`,
                'Accept': 'application/json',
            },
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('API Error:', errorText);
            return res.status(response.status).json({ error: errorText });
        }   

        const data = await response.json();
        res.json(data);
    } catch (error) {
        console.error('Error fetching profile data:', error.message);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Get specific part by ID
router.get('/part/:id', async (req, res) => {
    try {
        const partId = req.params.id;
        const response = await fetch(`${process.env.VITE_API_URL}/api/masterData/partTemplate/${partId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${process.env.VITE_API_BEARER_TOKEN}`,
                'Accept': 'application/json',
            },
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('API Error:', errorText);
            return res.status(response.status).json({ error: errorText });
        }

        const data = await response.json();
        res.json(data);
    } catch (error) {
        console.error('Error fetching part data:', error.message);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Get specific item master by ID
router.get('/itemsmaster/:id', async (req, res) => {
    try {
        const itemId = req.params.id;
        const response = await fetch(`${process.env.VITE_API_URL}/api/masterData/itemMaster/${itemId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${process.env.VITE_API_BEARER_TOKEN}`,
                'Accept': 'application/json',
            },
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('API Error:', errorText);
            return res.status(response.status).json({ error: errorText });
        }

        const data = await response.json();
        res.json(data);
    } catch (error) {
        console.error('Error fetching part data:', error.message);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});



// Get specific part by ID and hash
router.get('/material', async (req, res) => {
    try {
        const materialId = req.query.materialId;
        const hash = encodeURIComponent(req.query.hash);

        const response = await fetch(`${process.env.VITE_API_URL}/api/informationManagement/texture/${materialId}/texture?hash=${hash}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${process.env.VITE_API_BEARER_TOKEN}`
            },
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('API Error:', errorText);
            return res.status(response.status).json({ error: errorText });
        }

        // Get the content type from the response
        const contentType = response.headers.get('content-type');
        const buffer = await response.arrayBuffer();
        
        // Convert the binary data to base64
        const base64 = Buffer.from(buffer).toString('base64');
        
        // Return both the content type and base64 data
        res.json({
            contentType: contentType,
            data: `data:${contentType};base64,${base64}`
        });
    } catch (error) {
        console.error('Error fetching material data:', error.message);
        res.status(500).json({ error: error.message });
    }
});

router.get('/materialId/:id', async (req, res) => {
    try {
        const materialId = req.params.id;
        const response = await fetch(`${process.env.VITE_API_URL}/api/masterData/material/${materialId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${process.env.VITE_API_BEARER_TOKEN}`
            },
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('API Error:', errorText);
            return res.status(response.status).json({ error: errorText });
        }

        const data = await response.json();
        res.json(data);
    } catch (error) {
        console.error('Error fetching material data:', error.message);
        res.status(500).json({ error: error.message });
    }
});

router.get('/textureId/:id', async (req, res) => {
    try {
        const textureId = req.params.id;
        const response = await fetch(`${process.env.VITE_API_URL}/api/informationManagement/texture/${textureId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${process.env.VITE_API_BEARER_TOKEN}`
            },
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('API Error:', errorText);
            return res.status(response.status).json({ error: errorText });
        }

        const data = await response.json();
        res.json(data);
    } catch (error) {
        console.error('Error fetching material data:', error.message);
        res.status(500).json({ error: error.message });
    }
});

//Profile routes
router.get('/profiles', async (req, res) => {
    try {
        const response = await fetch(`${process.env.VITE_API_URL}/api/masterData/profileTemplate`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${process.env.VITE_API_BEARER_TOKEN}`,
                'Accept': 'application/json',
            },
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('API Error:', errorText);
            return res.status(response.status).json({ error: errorText });
        }

        const data = await response.json();
        res.json(data);
    } catch (error) {
        console.error('Error fetching data:', error.message);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});


//Item master routes
router.get('/items', async (req, res) => {
    try {
        const response = await fetch(`${process.env.VITE_API_URL}/api/masterData/itemMaster`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${process.env.VITE_API_BEARER_TOKEN}`,
                'Accept': 'application/json',
            },
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('API Error:', errorText);
            return res.status(response.status).json({ error: errorText });
        }

        const data = await response.json();
        res.json(data);
    } catch (error) {
        console.error('Error fetching data:', error.message);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

router.get('/ral',async(req,res)=>{
    try{
        const response = await fetch(`${process.env.VITE_API_URL}/api/color/ral`,{
            method:'GET',
            headers:{
                'Authorization':`Bearer ${process.env.VITE_API_BEARER_TOKEN}`,
                'Accept':'application/json',
            }
        })  
        if(!response.ok){
            const errorText = await response.text();
            console.error('API Error:', errorText);
            return res.status(response.status).json({ error: errorText });
        }   
        const data = await response.json();
        res.json(data);
    } catch (error) {
        console.error('Error fetching data:', error.message);
        res.status(500).json({ error: 'Internal Server Error' });
    }
})

module.exports = router;