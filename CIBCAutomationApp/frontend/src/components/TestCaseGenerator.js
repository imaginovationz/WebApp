import React, { useState, useEffect } from 'react';
import axios from 'axios';
import frontendRagConfig from '../frontendRagConfig';
import {
  Container, Grid, Paper, Typography, Button,
  CircularProgress, Snackbar, Alert, Box, List, ListItem,
  ListItemText, Card, CardContent
} from '@mui/material';
import ArticleIcon from '@mui/icons-material/Article';
import DownloadIcon from '@mui/icons-material/Download';
import { styled } from '@mui/material/styles';

// Simple styled input for file uploads
const Input = styled('input')({
  display: 'none',
});

function TestCaseGeneratorPage() {
  // This component is focused solely on generating test cases from requirement documents
  const [loading, setLoading] = useState(false);
  const [statusLoading, setStatusLoading] = useState(true);
  const [ragStatus, setRagStatus] = useState('not_trained');
  const [alertInfo, setAlertInfo] = useState({ show: false, message: '', severity: 'info' });
  const [requirementFile, setRequirementFile] = useState(null);
  const [generationResult, setGenerationResult] = useState(null);

  // Check RAG service status on component mount
  useEffect(() => {
    checkRagStatus();
  }, []);

  const checkRagStatus = async () => {
    setStatusLoading(true);
    try {
      const response = await axios.get(`${frontendRagConfig.ragBackendUrl}/api/rag/status`, {
        timeout: frontendRagConfig.timeout,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });
      
      setRagStatus(response.data.status || 'unavailable');
    } catch (error) {
      console.error("Error checking RAG status:", error);
      // Set status to unavailable when there's an error
      setRagStatus('unavailable');
      setAlertInfo({
        show: true,
        message: "Failed to check RAG service status. Please ensure the RAG service is running.",
        severity: "error"
      });
    } finally {
      setStatusLoading(false);
    }
  };

  const handleRequirementChange = (event) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      // Check supported file types
      const supportedTypes = ['.pdf', '.docx', '.doc', '.xlsx', '.xls', '.txt'];
      const fileExt = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
      if (!supportedTypes.includes(fileExt)) {
        setAlertInfo({
          show: true,
          message: `File type not supported. Please upload one of: ${supportedTypes.join(', ')}`,
          severity: "error"
        });
        return;
      }
      setRequirementFile(file);
    }
  };

  // No corpus upload function in this simplified component

  const handleGenerateTestCases = async () => {
    if (!requirementFile) {
      setAlertInfo({
        show: true,
        message: "Please select a requirements document first",
        severity: "warning"
      });
      return;
    }

    if (ragStatus !== 'ready') {
      setAlertInfo({
        show: true,
        message: "Please upload a test case corpus first",
        severity: "warning"
      });
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append('file', requirementFile);

    try {
      const response = await axios.post(`${frontendRagConfig.ragBackendUrl}/api/rag/requirements/upload`, formData, {
        timeout: frontendRagConfig.timeout,
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      const result = response.data;

      setAlertInfo({
        show: true,
        message: "Test cases generated successfully!",
        severity: "success"
      });
      setGenerationResult(result);
      // Reset file input
      setRequirementFile(null);
    } catch (error) {
      console.error("Error generating test cases:", error);
      setAlertInfo({
        show: true,
        message: error.response?.data?.error || error.message || "An error occurred while generating test cases. Make sure RAG server is running.",
        severity: "error"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAlertClose = () => {
    setAlertInfo({ ...alertInfo, show: false });
  };

  const handleDownload = () => {
    if (generationResult && generationResult.download_url) {
      const downloadUrl = generationResult.download_url.startsWith('http') 
        ? generationResult.download_url 
        : `${frontendRagConfig.ragBackendUrl}${generationResult.download_url}`;
      window.open(downloadUrl, '_blank');
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4, background: '#fff', p: 4, borderRadius: 1 }}>
      <Snackbar 
        open={alertInfo.show} 
        autoHideDuration={6000} 
        onClose={handleAlertClose}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={handleAlertClose} severity={alertInfo.severity} sx={{ width: '100%' }}>
          {alertInfo.message}
        </Alert>
      </Snackbar>
      
      <Typography variant="h4" component="h1" gutterBottom sx={{ color: '#CC0033', textAlign: 'center', mb: 4 }}>
        Test Case Generator from Requirements
      </Typography>
      <Typography variant="subtitle1" gutterBottom color="text.secondary" sx={{ textAlign: 'center', mb: 3 }}>
        Upload requirement documents and generate test cases using our RAG-powered AI
      </Typography>
      
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Button 
          variant="contained" 
          color="primary"
          onClick={() => window.location.href = '/'}
          sx={{ borderRadius: '4px' }}
        >
          Back to Home
        </Button>
        <Button 
          variant="contained" 
          color="primary"
          onClick={() => window.location.href = '/TestCaseKnowledgeBase'}
          sx={{ 
            borderRadius: '4px',
            backgroundColor: '#1976d2',
            '&:hover': { backgroundColor: '#115293' },
            color: 'white',
            fontWeight: 'bold',
            minWidth: '250px',
            py: 1
          }}
        >
          Go to Test Case Knowledge Base
        </Button>
      </Box>
      
      <Grid container spacing={3} sx={{ mt: 2 }}>
        {/* Status Card */}
        <Grid item xs={12}>
          <Paper 
            elevation={1}
            sx={{ 
              p: 3, 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between',
              bgcolor: 'white',
              borderLeft: 6, 
              borderColor: ragStatus === 'ready' ? '#4caf50' : '#ff9800'
            }}
          >
            <Box>
              <Typography variant="h6">
                RAG Service Status:
              </Typography>
              <Typography variant="body1" color="text.secondary">
                {statusLoading ? "Checking status..." : (
                  ragStatus === 'ready' 
                    ? "Ready to generate test cases" 
                    : "Not trained - Please use the Test Case Knowledge Base to upload corpus first"
                )}
              </Typography>
            </Box>
            {statusLoading && <CircularProgress size={24} />}
          </Paper>
        </Grid>
        
        {/* Generate Test Cases */}
        <Grid item xs={12}>
          <Paper elevation={1} sx={{ p: 3, height: '100%', border: '1px solid #e0e0e0' }}>
            <Typography variant="h6" gutterBottom>
              Generate Test Cases from Requirements
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Upload a requirements document (PDF, Word, Excel, or Text) to generate test cases based on the corpus.
            </Typography>
            
            <Box sx={{ display: 'flex', alignItems: 'center', mt: 2 }}>
              <label htmlFor="requirement-file">
                <Input
                  accept=".pdf,.docx,.doc,.xlsx,.xls,.txt"
                  id="requirement-file"
                  multiple={false}
                  type="file"
                  onChange={handleRequirementChange}
                />
                <Button
                  variant="contained"
                  component="span"
                  startIcon={<ArticleIcon />}
                  sx={{ mr: 2 }}
                  color="secondary"
                >
                  Select File
                </Button>
              </label>
              <Typography variant="body2" noWrap sx={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {requirementFile ? requirementFile.name : 'No file selected'}
              </Typography>
            </Box>
            
            <Button
              fullWidth
              variant="contained"
              color="secondary"
              disabled={!requirementFile || loading || ragStatus !== 'ready'}
              onClick={handleGenerateTestCases}
              sx={{ 
                mt: 2, 
                backgroundColor: '#0078D4', 
                '&:hover': { backgroundColor: '#106EBE' } 
              }}
            >
              {loading ? <CircularProgress size={24} /> : 'Generate Test Cases'}
            </Button>
            
            {generationResult && (
              <Card sx={{ mt: 3, bgcolor: '#f5f5f5', border: '1px solid #e0e0e0' }}>
                <CardContent>
                  <Typography variant="subtitle1" gutterBottom>
                    Test Cases Generated Successfully!
                  </Typography>
                  <List dense>
                    <ListItem>
                      <ListItemText 
                        primary="Input File" 
                        secondary={generationResult.input_filename} 
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText 
                        primary="Output File" 
                        secondary={generationResult.output_filename} 
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText 
                        primary="Processing Time" 
                        secondary={generationResult.processing_time} 
                      />
                    </ListItem>
                  </List>
                  <Button
                    fullWidth
                    variant="contained"
                    color="primary"
                    startIcon={<DownloadIcon />}
                    onClick={handleDownload}
                    sx={{ 
                      backgroundColor: '#0078D4', 
                      '&:hover': { backgroundColor: '#106EBE' } 
                    }}
                  >
                    Download Test Cases
                  </Button>
                </CardContent>
              </Card>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
}

export default TestCaseGeneratorPage;
