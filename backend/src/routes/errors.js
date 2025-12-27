import express from 'express';
import { sendErrorReport } from '../utils/email.js';

const router = express.Router();

// POST /api/errors/report - Submit an error report
router.post('/report', async (req, res) => {
  try {
    const {
      description,
      steps,
      userEmail,
      errorDetails,
      url,
      userAgent,
      timestamp,
      userId,
      userName,
    } = req.body;

    // Validate required fields
    if (!description || !description.trim()) {
      return res.status(400).json({ error: 'Description is required' });
    }

    // Prepare error report
    const errorReport = {
      description: description.trim(),
      steps: steps?.trim() || null,
      userEmail: userEmail?.trim() || null,
      errorDetails: errorDetails?.trim() || null,
      url: url || 'Unknown',
      userAgent: userAgent || 'Unknown',
      timestamp: timestamp || new Date().toISOString(),
      userId: userId || null,
      userName: userName || null,
    };

    // Send email
    try {
      await sendErrorReport(errorReport);
      console.log('Error report sent successfully');
    } catch (emailError) {
      console.error('Failed to send error report email:', emailError);
      // Don't fail the request if email fails - still return success
      // The error is logged for admin review
    }

    res.json({ 
      success: true, 
      message: 'Error report submitted successfully' 
    });
  } catch (error) {
    console.error('Error processing error report:', error);
    res.status(500).json({ 
      error: 'Failed to process error report' 
    });
  }
});

export default router;




