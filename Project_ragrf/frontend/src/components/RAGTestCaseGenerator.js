import React, { useState, useEffect } from 'react';
import axios from 'axios';
//import { useHistory } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';

import frontendRagConfig from '../frontendRagConfig';
import {
  Container,
  Box,
  Typography,
  Paper,
  Button,
  CircularProgress,
  Alert,
  Stepper,
  Step,
  StepLabel,
  Divider,
  Grid,
  Card,
  CardContent,
  CardActions,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormLabel,
  FormControl,
  TextField,
  Checkbox,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DownloadIcon from '@mui/icons-material/Download';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';

// Create a custom axios instance for RAG API calls
const ragApi = axios.create({
  baseURL: frontendRagConfig.ragBackendUrl,
  timeout: 120000, // 120 seconds timeout
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

const RAGTestCaseGenerator = () => {
  //const history = useHistory();
  const navigate = useNavigate();

  const [activeStep, setActiveStep] = useState(0);
  const [corpusFile, setCorpusFile] = useState(null);
  const [reqFile, setReqFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [ragStatus, setRagStatus] = useState('loading'); // 'loading', 'not_trained', 'ready', 'error'
  const [downloadUrl, setDownloadUrl] = useState('');
  const [processInfo, setProcessInfo] = useState(null);
  
  // Vector database reference options
  const [vectorReference, setVectorReference] = useState('whole'); // 'whole', 'specific', 'none'
  const [specificQuery, setSpecificQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedResults, setSelectedResults] = useState([]);

  const steps = ['Check Knowledge Base', 'Upload Test Corpus (Optional)', 'Upload Requirements', 'Download Test Cases'];
  
  const handleGoBack = () => {
    //history.push('/');
    navigate('/');
  };

  const handleGoToKnowledgeBase = () => {
    //history.push('/TestCaseKnowledgeBase');
    navigate('/TestCaseKnowledgeBase');
  };

  useEffect(() => {
    document.title = "Test Case Generation via RAG";
    
    // Wrap in try-catch for additional safety
    try {
      checkRagStatus();
    } catch (err) {
      console.error("Failed to check RAG status in useEffect:", err);
      setRagStatus('error');
      setError(`Critical error connecting to RAG service: ${err.message}`);
    }
  }, []);

  const checkRagStatus = async () => {
    try {
      setRagStatus('loading');
      console.log(`Connecting to RAG service at: ${frontendRagConfig.ragBackendUrl}/api/rag/status`);
      
      // Add transformResponse to handle non-JSON responses
      const response = await ragApi.get('/api/rag/status', {
        transformResponse: [(data) => {
          try {
            return JSON.parse(data);
          } catch (e) {
            console.error('Response is not valid JSON:', data.substring(0, 100));
            // Return the raw data so we can handle it in the catch block
            return data;
          }
        }],
        // Add validateStatus to handle all status codes
        validateStatus: function (status) {
          return true; // Always return true to handle all status codes in the then() block
        }
      });
      
      console.log('RAG status response:', response);
      
      if (response.status !== 200) {
        setRagStatus('error');
        const errorMessage = `Server returned ${response.status} ${response.statusText}. Please check if the RAG server is running at ${frontendRagConfig.ragBackendUrl}`;
        setError(errorMessage);
        console.error('Non-200 status:', response.status, response.statusText);
        return;
      }
      
      // Check if the response data is a string (not parsed as JSON)
      if (typeof response.data === 'string') {
        setRagStatus('error');
        setError(`Server didn't return valid JSON. Please check if the RAG server is running correctly at ${frontendRagConfig.ragBackendUrl}`);
        console.error('Invalid JSON response:', response.data.substring(0, 100));
        return;
      }
      
      // With axios, successful responses are automatically in the data property
      const data = response.data;
      console.log('Parsed data:', data);
      setRagStatus(data.status);
      if (data.status === 'ready') {
        setActiveStep(2); // Skip to upload requirements step
      }
    } catch (err) {
      setRagStatus('error');
      console.error('Full error object:', err);
      
      // Handle different types of errors with axios
      if (err.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        setError(`Server returned ${err.response.status} ${err.response.statusText}. Please check if the RAG server is running at ${frontendRagConfig.ragBackendUrl}`);
        console.error('Server error:', err.response.status);
        // Log the first 100 characters of the response to see what's coming back
        if (err.response.data && typeof err.response.data === 'string') {
          console.error('Response preview:', err.response.data.substring(0, 100));
        }
      } else if (err.request) {
        // The request was made but no response was received
        setError(`Failed to connect to RAG service at ${frontendRagConfig.ragBackendUrl}. Please check if the server is running.`);
        console.error('No response received:', err.request);
      } else {
        // Something happened in setting up the request that triggered an Error
        setError(`Error: ${err.message}`);
        console.error('Error setting up request:', err.message);
      }
    }
  };

  const handleCorpusFileChange = (event) => {
    setCorpusFile(event.target.files[0]);
    setError('');
    setSuccess('');
  };

  const handleReqFileChange = (event) => {
    setReqFile(event.target.files[0]);
    setError('');
    setSuccess('');
    setDownloadUrl('');
  };

  // Search specific test cases for reference
  const searchSpecificTestCases = async () => {
    if (!specificQuery.trim()) {
      setError('Please enter a search query');
      return;
    }

    try {
      setLoading(true);
      const response = await ragApi.post('/api/rag/testcases/search', {
        query: specificQuery,
        k: 10
      });

      setSearchResults(response.data.results || []);
      setSelectedResults([]);
      setSuccess(`Found ${response.data.count || 0} test cases matching your query`);
    } catch (err) {
      console.error('Error searching test cases:', err);
      setError('Failed to search test cases');
    } finally {
      setLoading(false);
    }
  };

  const handleResultSelection = (index, checked) => {
    if (checked) {
      setSelectedResults([...selectedResults, index]);
    } else {
      setSelectedResults(selectedResults.filter(i => i !== index));
    }
  };

  const uploadCorpus = async () => {
    if (!corpusFile) {
      setError('Please select a file to upload');
      return;
    }

    const allowedExtensions = ['.xlsx', '.xls', '.xlsm'];
    const fileExtension = corpusFile.name.substring(corpusFile.name.lastIndexOf('.')).toLowerCase();
    
    if (!allowedExtensions.includes(fileExtension)) {
      setError('Only Excel files (.xlsx, .xls, .xlsm) are allowed for test case corpus');
      return;
    }

    try {
      setLoading(true);
      setError('');
      setSuccess('');

      const formData = new FormData();
      formData.append('file', corpusFile);

      // Using our custom axios instance
      const response = await ragApi.post(
        '/api/rag/corpus/upload', 
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          },
          transformResponse: [(data) => {
            try {
              return JSON.parse(data);
            } catch (e) {
              console.error('Response is not valid JSON:', data.substring(0, 100));
              return data;
            }
          }]
        }
      );

      // With axios, successful responses are directly in the data property
      const data = response.data;
      setSuccess('Test case corpus uploaded successfully!');
      setProcessInfo(data);
      setRagStatus('ready');
      setActiveStep(2); // Move to next step
    } catch (err) {
      // Handle different types of errors with axios
      if (err.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        const errorMessage = err.response.data?.error || `Server error: ${err.response.status}`;
        setError(errorMessage);
        console.error('Server error:', err.response.status, err.response.data);
      } else if (err.request) {
        // The request was made but no response was received
        setError(`Failed to connect to RAG service at ${frontendRagConfig.ragBackendUrl}. Please check if the server is running.`);
        console.error('No response received:', err.request);
      } else {
        // Something happened in setting up the request that triggered an Error
        setError(`Error: ${err.message}`);
        console.error('Error setting up request:', err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const uploadRequirements = async () => {
    if (!reqFile) {
      setError('Please select a file to upload');
      return;
    }

    // Validation for specific reference option
    if (vectorReference === 'specific' && selectedResults.length === 0) {
      setError('Please search and select specific test cases for reference');
      return;
    }

    const allowedExtensions = ['.pdf', '.docx', '.doc', '.txt', '.xlsx', '.xls', '.xlsm'];
    const fileExtension = reqFile.name.substring(reqFile.name.lastIndexOf('.')).toLowerCase();
    
    if (!allowedExtensions.includes(fileExtension)) {
      setError('File type not supported. Please upload PDF, Word, Text, or Excel files.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      setSuccess('');

      const formData = new FormData();
      formData.append('file', reqFile);
      formData.append('vector_reference', vectorReference);
      
      if (vectorReference === 'specific') {
        formData.append('specific_query', specificQuery);
        formData.append('selected_results', JSON.stringify(selectedResults.map(index => searchResults[index])));
      }

      // Using our custom axios instance
      const response = await ragApi.post(
        '/api/rag/requirements/upload',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          },
          transformResponse: [(data) => {
            try {
              return JSON.parse(data);
            } catch (e) {
              console.error('Response is not valid JSON:', data.substring(0, 100));
              return data;
            }
          }]
        }
      );

      // With axios, successful responses are directly in the data property
      const data = response.data;
      setSuccess('Test cases generated successfully!');
      setProcessInfo(data);
      // Make sure the download URL has the full base URL
      setDownloadUrl(`${frontendRagConfig.ragBackendUrl}${data.download_url}`);
      setActiveStep(3); // Move to download step
    } catch (err) {
      // Handle different types of errors with axios
      if (err.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        const errorMessage = err.response.data?.error || `Server error: ${err.response.status}`;
        setError(errorMessage);
        console.error('Server error:', err.response.status, err.response.data);
      } else if (err.request) {
        // The request was made but no response was received
        setError(`Failed to connect to RAG service at ${frontendRagConfig.ragBackendUrl}. Please check if the server is running.`);
        console.error('No response received:', err.request);
      } else {
        // Something happened in setting up the request that triggered an Error
        setError(`Error: ${err.message}`);
        console.error('Error setting up request:', err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = (step) => {
    switch (step) {
      case 0: // Check RAG Status
        return (
          <Box sx={{ textAlign: 'center', p: 3 }}>
            {ragStatus === 'loading' ? (
              <>
                <CircularProgress />
                <Typography variant="h6" sx={{ mt: 2 }}>Checking RAG Service Status...</Typography>
              </>
            ) : ragStatus === 'ready' ? (
              <>
                <CheckCircleOutlineIcon color="success" sx={{ fontSize: 60 }} />
                <Typography variant="h6" sx={{ mt: 2 }}>RAG Service is Ready</Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
                  The RAG service is trained and ready to generate test cases.
                </Typography>
                <Button 
                  variant="contained" 
                  color="primary" 
                  sx={{ mt: 2 }} 
                  onClick={() => setActiveStep(2)}
                >
                  Continue to Upload Requirements
                </Button>
              </>
            ) : ragStatus === 'not_trained' ? (
              <>
                <HelpOutlineIcon color="warning" sx={{ fontSize: 60 }} />
                <Typography variant="h6" sx={{ mt: 2 }}>RAG Service Needs Training</Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
                  The RAG service needs training data. Please upload a test case corpus.
                </Typography>
                <Button 
                  variant="contained" 
                  color="primary" 
                  sx={{ mt: 2 }} 
                  onClick={() => setActiveStep(1)}
                >
                  Continue to Upload Corpus
                </Button>
              </>
            ) : (
              <>
                <ErrorOutlineIcon color="error" sx={{ fontSize: 60 }} />
                <Typography variant="h6" sx={{ mt: 2 }}>RAG Service Error</Typography>
                <Typography variant="body1" color="error" sx={{ mt: 1 }}>
                  {error || 'There was an error connecting to the RAG service.'}
                </Typography>
                <Button 
                  variant="contained" 
                  color="primary"
                  sx={{ mt: 2, borderRadius: '4px' }} 
                  onClick={checkRagStatus}
                >
                  Retry
                </Button>
              </>
            )}
          </Box>
        );
      
      case 1: // Upload Test Corpus
        return (
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Upload Test Case Corpus
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Upload an Excel file containing existing test cases to train the RAG model.
              This will be used as reference data to generate new test cases.
            </Typography>
            
            <input
              accept=".xlsx,.xls,.xlsm"
              style={{ display: 'none' }}
              id="corpus-file-input"
              type="file"
              onChange={handleCorpusFileChange}
              disabled={loading}
            />
            <label htmlFor="corpus-file-input">
              <Button
                variant="outlined"
                component="span"
                startIcon={<CloudUploadIcon />}
                disabled={loading}
                sx={{ mb: 2 }}
              >
                Select Corpus File
              </Button>
            </label>
            
            {corpusFile && (
              <Typography variant="body2" sx={{ mb: 2 }}>
                Selected file: {corpusFile.name}
              </Typography>
            )}
            
            <Button
              variant="contained"
              color="primary"
              onClick={uploadCorpus}
              disabled={!corpusFile || loading}
              sx={{ mt: 1 }}
            >
              {loading ? <CircularProgress size={24} /> : 'Upload and Process Corpus'}
            </Button>
            
            {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
            {success && <Alert severity="success" sx={{ mt: 2 }}>{success}</Alert>}
            
            {processInfo && (
              <Paper sx={{ mt: 2, p: 2 }}>
                <Typography variant="subtitle2" gutterBottom>Processing Results</Typography>
                <Typography variant="body2">Documents processed: {processInfo.document_count}</Typography>
                <Typography variant="body2">Processing time: {processInfo.processing_time}</Typography>
              </Paper>
            )}
          </Box>
        );
      
      case 2: // Upload Requirements
        return (
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Upload Requirements Document
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Upload a requirements document in PDF, Word, Text, or Excel format.
              The RAG system will generate test cases based on these requirements.
            </Typography>
            
            <input
              accept=".pdf,.docx,.doc,.txt,.xlsx,.xls,.xlsm"
              style={{ display: 'none' }}
              id="req-file-input"
              type="file"
              onChange={handleReqFileChange}
              disabled={loading}
            />
            <label htmlFor="req-file-input">
              <Button
                variant="outlined"
                component="span"
                startIcon={<CloudUploadIcon />}
                disabled={loading}
                sx={{ mb: 2 }}
              >
                Select Requirements File
              </Button>
            </label>
            
            {reqFile && (
              <Typography variant="body2" sx={{ mb: 2 }}>
                Selected file: {reqFile.name}
              </Typography>
            )}

            {/* Vector Database Reference Options */}
            <Paper sx={{ p: 2, mt: 2, mb: 2 }}>
              <FormControl component="fieldset">
                <FormLabel component="legend">Vector Database Reference</FormLabel>
                <RadioGroup
                  value={vectorReference}
                  onChange={(e) => setVectorReference(e.target.value)}
                  sx={{ mt: 1 }}
                >
                  <FormControlLabel 
                    value="whole" 
                    control={<Radio />} 
                    label="Use Entire Vector Database" 
                  />
                  <FormControlLabel 
                    value="specific" 
                    control={<Radio />} 
                    label="Use Specific Test Cases" 
                  />
                  <FormControlLabel 
                    value="none" 
                    control={<Radio />} 
                    label="No Vector Database Reference" 
                  />
                </RadioGroup>
              </FormControl>

              {/* Specific Test Case Search */}
              {vectorReference === 'specific' && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Search and Select Specific Test Cases
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                    <TextField
                      fullWidth
                      placeholder="Enter search query to find relevant test cases..."
                      value={specificQuery}
                      onChange={(e) => setSpecificQuery(e.target.value)}
                      disabled={loading}
                      size="small"
                    />
                    <Button
                      variant="contained"
                      onClick={searchSpecificTestCases}
                      disabled={loading || !specificQuery.trim()}
                      startIcon={<SearchIcon />}
                    >
                      Search
                    </Button>
                  </Box>

                  {/* Search Results */}
                  {searchResults.length > 0 && (
                    <Box sx={{ maxHeight: 300, overflow: 'auto', border: 1, borderColor: 'grey.300', borderRadius: 1 }}>
                      <List dense>
                        {searchResults.map((result, index) => (
                          <ListItem key={index} divider>
                            <ListItemIcon>
                              <Checkbox
                                checked={selectedResults.includes(index)}
                                onChange={(e) => handleResultSelection(index, e.target.checked)}
                                size="small"
                              />
                            </ListItemIcon>
                            <ListItemText
                              primary={result.content.substring(0, 100) + '...'}
                              secondary={`Score: ${result.score.toFixed(3)}`}
                            />
                          </ListItem>
                        ))}
                      </List>
                    </Box>
                  )}

                  {selectedResults.length > 0 && (
                    <Typography variant="body2" sx={{ mt: 1, color: 'success.main' }}>
                      {selectedResults.length} test case(s) selected for reference
                    </Typography>
                  )}
                </Box>
              )}
            </Paper>
            
            <Button
              variant="contained"
              color="primary"
              size="small"
              onClick={uploadRequirements}
              disabled={!reqFile || loading || (vectorReference === 'specific' && selectedResults.length === 0)}
              sx={{ 
                mt: 1,
                borderRadius: '4px'
              }}
            >
              {loading ? <CircularProgress size={24} /> : 'Generate Test Cases'}
            </Button>
            
            {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
            {success && <Alert severity="success" sx={{ mt: 2 }}>{success}</Alert>}
            
            {processInfo && downloadUrl && (
              <Paper sx={{ mt: 2, p: 2 }}>
                <Typography variant="subtitle2" gutterBottom>Processing Results</Typography>
                <Typography variant="body2">Input file: {processInfo.input_filename}</Typography>
                <Typography variant="body2">Output file: {processInfo.output_filename}</Typography>
                <Typography variant="body2">Processing time: {processInfo.processing_time}</Typography>
              </Paper>
            )}
          </Box>
        );
      
      case 3: // Download Test Cases
        return (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <CheckCircleOutlineIcon color="success" sx={{ fontSize: 60 }} />
            <Typography variant="h6" sx={{ mt: 2 }}>Test Cases Generated Successfully!</Typography>
            
            <Typography variant="body1" sx={{ mt: 2 }}>
              Your test cases are ready to download in Excel format.
            </Typography>
            
            {downloadUrl && (
              <Button
                variant="contained"
                color="primary"
                startIcon={<DownloadIcon />}
                href={downloadUrl}
                sx={{ mt: 3 }}
              >
                Download Test Cases
              </Button>
            )}
            
            <Button
              variant="outlined"
              sx={{ mt: 3, ml: 2 }}
              onClick={() => {
                setReqFile(null);
                setProcessInfo(null);
                setActiveStep(2);
              }}
            >
              Generate More Test Cases
            </Button>
          </Box>
        );
      
      default:
        return null;
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom sx={{ color: '#CC0033', textAlign: 'center', mb: 4 }}>
        Test Case Generation via RAG
      </Typography>

      <Typography variant="body1" color="text.secondary" sx={{ mb: 3, textAlign: 'center' }}>
        Upload requirement documents and generate test cases using our RAG-powered AI
      </Typography>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Button 
          variant="contained" 
          color="primary"
          onClick={handleGoToKnowledgeBase}
          sx={{ borderRadius: '4px' }}
        >
          Check Knowledge Base
        </Button>
        <Button 
          variant="contained" 
          color="primary"
          onClick={handleGoBack}
          sx={{ borderRadius: '4px' }}
        >
          Back to Home
        </Button>
      </Box>

      <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column' }}>

        <Stepper activeStep={activeStep} sx={{ mb: 4 }} alternativeLabel>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        <Divider sx={{ mb: 3 }} />

        {renderStepContent(activeStep)}
      </Paper>
      
      <Grid container spacing={3} sx={{ mt: 3 }}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>How It Works</Typography>
              <Typography variant="body2" paragraph>
                This tool uses Retrieval-Augmented Generation (RAG) to create test cases based on your requirements.
                It leverages a corpus of existing test cases as reference material to generate relevant and comprehensive test cases.
              </Typography>
              <Typography variant="body2">
                1. Upload an Excel file containing existing test cases (corpus)
              </Typography>
              <Typography variant="body2">
                2. Upload your requirements document
              </Typography>
              <Typography variant="body2">
                3. The system generates test cases in Excel format
              </Typography>
              <Typography variant="body2">
                4. Download and use the generated test cases
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Supported File Types</Typography>
              <Typography variant="subtitle2">For Test Case Corpus:</Typography>
              <Typography variant="body2" paragraph>
                Excel files (.xlsx, .xls, .xlsm)
              </Typography>
              
              <Typography variant="subtitle2">For Requirements Documents:</Typography>
              <Typography variant="body2" paragraph>
                • PDF files (.pdf)<br />
                • Word documents (.docx, .doc)<br />
                • Text files (.txt)<br />
                • Excel files (.xlsx, .xls, .xlsm)
              </Typography>
            </CardContent>
            <CardActions>
              <Button 
                variant="contained" 
                color="primary"
                size="small"
                onClick={() => checkRagStatus()}
                sx={{ borderRadius: '4px' }}
              >
                Refresh RAG Status
              </Button>
            </CardActions>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
};

export default RAGTestCaseGenerator;
