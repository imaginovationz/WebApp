import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import frontendRagConfig from '../frontendRagConfig';
import {
  Container,
  Paper,
  Typography,
  Box,
  Button,
  Grid,
  Card,
  CardContent,
  CardActions,
  TextField,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  Divider,
  Alert,
  Snackbar,
  CircularProgress,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Tooltip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import {
  CloudUpload as UploadIcon,
  Search as SearchIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  Storage as StorageIcon,
  Assessment as StatsIcon,
  ExpandMore as ExpandMoreIcon,
  FilterList as FilterIcon,
  Clear as ClearIcon
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';

const Input = styled('input')({
  display: 'none',
});

function TabPanel(props) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`tabpanel-${index}`}
      aria-labelledby={`tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const TestCaseKnowledgeBase = () => {
  const history = useNavigate();
  
  // State management
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Upload state
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadDescription, setUploadDescription] = useState('');
  const [uploadTags, setUploadTags] = useState('');
  
  // Inventory state
  const [inventory, setInventory] = useState({ uploads: [], total_test_cases: 0 });
  const [stats, setStats] = useState({ document_count: 0, is_ready: false });
  const [inventoryFilters, setInventoryFilters] = useState({
    query: '',
    file_type: '',
    tags: []
  });
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [selectedResult, setSelectedResult] = useState(null);
  const [resultDialog, setResultDialog] = useState(false);
  
  useEffect(() => {
    loadInventory();
  }, []);

  const showMessage = (message, severity = 'info') => {
    if (severity === 'error') {
      setError(message);
    } else {
      setSuccess(message);
    }
  };

  const loadInventory = async () => {
    try {
      const response = await axios.get(`${frontendRagConfig.ragBackendUrl}/api/rag/inventory`, {
        timeout: frontendRagConfig.timeout
      });
      
      setInventory(response.data.inventory);
      setStats(response.data.stats);
    } catch (err) {
      showMessage(err.response?.data?.error || 'Failed to connect to RAG service', 'error');
      console.error('Error loading inventory:', err);
    }
  };

  const handleFileUpload = (event) => {
    setUploadFile(event.target.files[0]);
    setError('');
    setSuccess('');
  };

  const uploadTestCases = async () => {
    if (!uploadFile) {
      showMessage('Please select a file to upload', 'error');
      return;
    }

    const allowedExtensions = ['.xlsx', '.xls', '.xlsm', '.pdf', '.docx', '.txt'];
    const fileExtension = uploadFile.name.substring(uploadFile.name.lastIndexOf('.')).toLowerCase();
    
    if (!allowedExtensions.includes(fileExtension)) {
      showMessage('File type not supported. Please upload Excel, PDF, Word, or Text files.', 'error');
      return;
    }

    try {
      setLoading(true);
      setError('');
      setSuccess('');

      const formData = new FormData();
      formData.append('file', uploadFile);
      formData.append('description', uploadDescription);
      formData.append('tags', uploadTags);

      const response = await axios.post(`${frontendRagConfig.ragBackendUrl}/api/rag/corpus/upload`, formData, {
        timeout: frontendRagConfig.timeout,
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      showMessage('Test cases uploaded successfully!', 'success');
      setUploadFile(null);
      setUploadDescription('');
      setUploadTags('');
      loadInventory(); // Refresh inventory
    } catch (err) {
      showMessage(err.response?.data?.error || 'Failed to upload test cases', 'error');
      console.error('Error uploading:', err);
    } finally {
      setLoading(false);
    }
  };

  const searchInventory = async () => {
    try {
      const response = await axios.post(`${frontendRagConfig.ragBackendUrl}/api/rag/inventory/search`, inventoryFilters, {
        timeout: frontendRagConfig.timeout,
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      setInventory({ ...inventory, uploads: response.data.results });
    } catch (err) {
      showMessage(err.response?.data?.error || 'Failed to search inventory', 'error');
      console.error('Error searching inventory:', err);
    }
  };

  const searchTestCases = async () => {
    if (!searchQuery.trim()) {
      showMessage('Please enter a search query', 'error');
      return;
    }

    try {
      setSearchLoading(true);
      const response = await axios.post(`${frontendRagConfig.ragBackendUrl}/api/rag/testcases/search`, {
        query: searchQuery,
        k: 10
      }, {
        timeout: frontendRagConfig.timeout,
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      setSearchResults(response.data.results);
      showMessage(`Found ${response.data.count} test cases matching your query`, 'success');
    } catch (err) {
      showMessage(err.response?.data?.error || 'Failed to search test cases', 'error');
      console.error('Error searching test cases:', err);
    } finally {
      setSearchLoading(false);
    }
  };

  const deleteFromInventory = async (uploadId) => {
    try {
      await axios.delete(`${frontendRagConfig.ragBackendUrl}/api/rag/inventory/${uploadId}`, {
        timeout: frontendRagConfig.timeout
      });

      showMessage('Upload removed from inventory', 'success');
      loadInventory(); // Refresh inventory
    } catch (err) {
      showMessage(err.response?.data?.error || 'Failed to delete from inventory', 'error');
      console.error('Error deleting:', err);
    }
  };

  const viewTestCaseDetails = (result) => {
    setSelectedResult(result);
    setResultDialog(true);
  };

  const clearInventoryFilters = () => {
    setInventoryFilters({ query: '', file_type: '', tags: [] });
    loadInventory();
  };

  const renderUploadTab = () => (
    <Grid container spacing={3}>
      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Upload Test Cases to Knowledge Base
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Upload test case documents to build and expand your test case knowledge base.
              Supported formats: Excel, PDF, Word, and Text files.
            </Typography>

            <Box sx={{ mb: 2 }}>
              <label htmlFor="upload-file">
                <Input
                  accept=".pdf,.docx,.doc,.xlsx,.xls,.xlsm,.txt"
                  id="upload-file"
                  type="file"
                  onChange={handleFileUpload}
                />
                <Button
                  variant="contained"
                  component="span"
                  startIcon={<UploadIcon />}
                  fullWidth
                  sx={{ 
                    mb: 2, 
                    backgroundColor: '#0078D4', 
                    '&:hover': { backgroundColor: '#106EBE' },
                    color: 'white',
                    fontWeight: 'bold',
                    textTransform: 'none',
                    fontSize: '0.875rem',
                    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif'
                  }}
                >
                  Select File
                </Button>
              </label>
              {uploadFile && (
                <Typography variant="body2" color="text.secondary">
                  Selected: {uploadFile.name}
                </Typography>
              )}
            </Box>

            <TextField
              fullWidth
              label="Description"
              value={uploadDescription}
              onChange={(e) => setUploadDescription(e.target.value)}
              placeholder="Describe the test cases in this file..."
              multiline
              rows={2}
              sx={{ mb: 2 }}
            />

            <TextField
              fullWidth
              label="Tags (comma-separated)"
              value={uploadTags}
              onChange={(e) => setUploadTags(e.target.value)}
              placeholder="e.g. regression, api, ui, smoke"
              sx={{ mb: 2 }}
            />

            <Button
              fullWidth
              variant="contained"
              onClick={uploadTestCases}
              disabled={!uploadFile || loading}
              startIcon={loading ? <CircularProgress size={20} /> : <UploadIcon />}
              sx={{ 
                backgroundColor: '#1976d2', 
                '&:hover': { backgroundColor: '#115293' },
                '&:disabled': { backgroundColor: '#ccc' },
                color: 'white !important',
                fontWeight: 'bold',
                py: 1.5
              }}
            >
              {loading ? 'Uploading...' : 'Upload to Knowledge Base'}
            </Button>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <StatsIcon sx={{ mr: 1 }} />
              <Typography variant="h6">Knowledge Base Statistics</Typography>
            </Box>
            
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Paper sx={{ p: 2, textAlign: 'center', bgcolor: '#e3f2fd' }}>
                  <Typography variant="h4" color="primary">
                    {stats.total_uploads || 0}
                  </Typography>
                  <Typography variant="body2">Files Uploaded</Typography>
                </Paper>
              </Grid>
              <Grid item xs={6}>
                <Paper sx={{ p: 2, textAlign: 'center', bgcolor: '#f3e5f5' }}>
                  <Typography variant="h4" color="secondary">
                    {inventory.total_test_cases || 0}
                  </Typography>
                  <Typography variant="body2">Test Cases</Typography>
                </Paper>
              </Grid>
              <Grid item xs={6}>
                <Paper sx={{ p: 2, textAlign: 'center', bgcolor: '#e8f5e8' }}>
                  <Typography variant="h4" color="success.main">
                    {stats.document_count || 0}
                  </Typography>
                  <Typography variant="body2">Vector Chunks</Typography>
                </Paper>
              </Grid>
              <Grid item xs={6}>
                <Paper sx={{ p: 2, textAlign: 'center', bgcolor: stats.is_ready ? '#e8f5e8' : '#ffebee' }}>
                  <Typography variant="h4" color={stats.is_ready ? 'success.main' : 'error.main'}>
                    {stats.is_ready ? '✓' : '✗'}
                  </Typography>
                  <Typography variant="body2">Ready</Typography>
                </Paper>
              </Grid>
            </Grid>

            {inventory.last_updated && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                Last updated: {new Date(inventory.last_updated).toLocaleString()}
              </Typography>
            )}
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  const renderInventoryTab = () => (
    <Box>
      {/* Filters */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <FilterIcon sx={{ mr: 1 }} />
          <Typography variant="h6">Filter Inventory</Typography>
        </Box>
        
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Search files..."
              value={inventoryFilters.query}
              onChange={(e) => setInventoryFilters({ ...inventoryFilters, query: e.target.value })}
              placeholder="Search by filename or description"
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>File Type</InputLabel>
              <Select
                value={inventoryFilters.file_type}
                onChange={(e) => setInventoryFilters({ ...inventoryFilters, file_type: e.target.value })}
                label="File Type"
              >
                <MenuItem value="">All Types</MenuItem>
                <MenuItem value=".xlsx">Excel (.xlsx)</MenuItem>
                <MenuItem value=".pdf">PDF (.pdf)</MenuItem>
                <MenuItem value=".docx">Word (.docx)</MenuItem>
                <MenuItem value=".txt">Text (.txt)</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={3}>
            <Button
              variant="contained"
              onClick={searchInventory}
              startIcon={<SearchIcon />}
              sx={{ 
                mr: 1,
                backgroundColor: '#1976d2', 
                '&:hover': { backgroundColor: '#115293' },
                color: 'white',
                fontWeight: 'bold'
              }}
            >
              Filter
            </Button>
            <Button
              variant="outlined"
              onClick={clearInventoryFilters}
              startIcon={<ClearIcon />}
              sx={{
                borderColor: '#1976d2',
                color: '#1976d2',
                '&:hover': { 
                  borderColor: '#115293',
                  backgroundColor: '#f5f5f5'
                }
              }}
            >
              Clear
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Inventory List */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>File Name</TableCell>
              <TableCell>Upload Date</TableCell>
              <TableCell>Test Cases</TableCell>
              <TableCell>File Size</TableCell>
              <TableCell>Tags</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {inventory.uploads.map((upload) => (
              <TableRow key={upload.id}>
                <TableCell>
                  <Box>
                    <Typography variant="body2" fontWeight="bold">
                      {upload.filename}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {upload.description}
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell>
                  {new Date(upload.upload_date).toLocaleDateString()}
                </TableCell>
                <TableCell>{upload.test_case_count}</TableCell>
                <TableCell>
                  {(upload.file_size / 1024).toFixed(1)} KB
                </TableCell>
                <TableCell>
                  {upload.tags.map((tag) => (
                    <Chip key={tag} label={tag} size="small" sx={{ mr: 0.5 }} />
                  ))}
                </TableCell>
                <TableCell>
                  <Tooltip title="Delete from inventory">
                    <IconButton
                      color="error"
                      onClick={() => deleteFromInventory(upload.id)}
                      size="small"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {inventory.uploads.length === 0 && (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <StorageIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary">
            No test cases uploaded yet
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Upload your first test case document to get started
          </Typography>
        </Paper>
      )}
    </Box>
  );

  const renderSearchTab = () => (
    <Box>
      {/* Search Input */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography variant="h6" gutterBottom>
          Search Test Cases
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <TextField
            fullWidth
            label="Search query..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="e.g. login functionality, user authentication, api testing"
            onKeyPress={(e) => e.key === 'Enter' && searchTestCases()}
          />
          <Button
            variant="contained"
            onClick={searchTestCases}
            disabled={searchLoading}
            startIcon={searchLoading ? <CircularProgress size={20} /> : <SearchIcon />}
            sx={{ 
              minWidth: 120,
              backgroundColor: '#1976d2', 
              '&:hover': { backgroundColor: '#115293' },
              '&:disabled': { backgroundColor: '#ccc' },
              color: 'white',
              fontWeight: 'bold'
            }}
          >
            {searchLoading ? 'Searching...' : 'Search'}
          </Button>
        </Box>
      </Paper>

      {/* Search Results */}
      {searchResults.length > 0 && (
        <Box>
          <Typography variant="h6" gutterBottom>
            Search Results ({searchResults.length})
          </Typography>
          
          {searchResults.map((result, index) => (
            <Accordion key={index} sx={{ mb: 1 }}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Box sx={{ flexGrow: 1 }}>
                  <Typography variant="subtitle1">
                    {result.test_case_id || `Test Case ${index + 1}`}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Similarity: {(result.similarity_score * 100).toFixed(1)}% | 
                    Source: {result.source.split('/').pop()}
                  </Typography>
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                <Typography variant="body2" component="pre" sx={{ whiteSpace: 'pre-wrap' }}>
                  {result.content}
                </Typography>
              </AccordionDetails>
            </Accordion>
          ))}
        </Box>
      )}

      {searchQuery && searchResults.length === 0 && !searchLoading && (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <SearchIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary">
            No test cases found
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Try adjusting your search query or upload more test cases
          </Typography>
        </Paper>
      )}
    </Box>
  );

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom sx={{ color: '#CC0033' }}>
            Test Case Knowledge Base
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            Manage your test case inventory and search through your knowledge base
          </Typography>
        </Box>
        <Box>
          <Button 
            variant="contained" 
            onClick={() => history.push('/test-case-generator')}
            sx={{ 
              mr: 2,
              backgroundColor: '#0078D4', 
              '&:hover': { backgroundColor: '#106EBE' },
              color: 'white',
              fontWeight: 'bold'
            }}
          >
            Generate Test Cases
          </Button>
          <Button 
            variant="contained" 
            onClick={() => history.push('/RaGTestCaseGenerator')}
            sx={{ 
              mr: 2,
              backgroundColor: '#28a745', 
              '&:hover': { backgroundColor: '#218838' },
              color: 'white',
              fontWeight: 'bold'
            }}
          >
            RAG TCs Generator
          </Button>
          <Button 
            variant="contained" 
            onClick={() => history.push('/')}
            sx={{
              backgroundColor: '#1976d2', 
              '&:hover': { backgroundColor: '#115293' },
              color: 'white',
              fontWeight: 'bold'
            }}
          >
            Back to Home
          </Button>
        </Box>
      </Box>

      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs 
          value={activeTab} 
          onChange={(e, newValue) => setActiveTab(newValue)}
          aria-label="knowledge base tabs"
          sx={{
            backgroundColor: '#1976d2',
            '& .MuiTab-root': {
              textTransform: 'none',
              fontSize: '0.875rem',
              fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
              fontWeight: 500,
              minWidth: 160,
              color: 'white'
            },
            '& .MuiTab-root.Mui-selected': {
              color: 'white',
              fontWeight: 600
            },
            '& .MuiTabs-indicator': {
              backgroundColor: 'white'
            }
          }}
        >
          <Tab label="Upload Test Cases" />
          <Tab label="Inventory Management" />
          <Tab label="Vector Search TC's" />
        </Tabs>
      </Paper>

      {/* Tab Content */}
      <TabPanel value={activeTab} index={0}>
        {renderUploadTab()}
      </TabPanel>
      
      <TabPanel value={activeTab} index={1}>
        {renderInventoryTab()}
      </TabPanel>
      
      <TabPanel value={activeTab} index={2}>
        {renderSearchTab()}
      </TabPanel>

      {/* Alerts */}
      <Snackbar 
        open={!!error} 
        autoHideDuration={6000} 
        onClose={() => setError('')}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={() => setError('')} severity="error" sx={{ width: '100%' }}>
          {error}
        </Alert>
      </Snackbar>

      <Snackbar 
        open={!!success} 
        autoHideDuration={4000} 
        onClose={() => setSuccess('')}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={() => setSuccess('')} severity="success" sx={{ width: '100%' }}>
          {success}
        </Alert>
      </Snackbar>

      {/* Test Case Details Dialog */}
      <Dialog 
        open={resultDialog} 
        onClose={() => setResultDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Test Case Details</DialogTitle>
        <DialogContent>
          {selectedResult && (
            <Box>
              <Typography variant="h6" gutterBottom>
                {selectedResult.test_case_id || 'Test Case'}
              </Typography>
              <Typography variant="body2" component="pre" sx={{ whiteSpace: 'pre-wrap' }}>
                {selectedResult.content}
              </Typography>
              <Divider sx={{ my: 2 }} />
              <Typography variant="caption" color="text.secondary">
                Similarity Score: {(selectedResult.similarity_score * 100).toFixed(1)}% | 
                Source: {selectedResult.source}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setResultDialog(false)}
            sx={{ color: 'white' }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default TestCaseKnowledgeBase;
