import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { API_URL } from '@/config/api';
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { fetchWithAdminAuth } from "@/utils/adminAuth";
import { Loader2, Search, User, Mail, Phone, MapPin, DollarSign, Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";
import { formatDualCurrencyCompact } from "@/utils/currency";

export default function CustomerManagementComponent() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchInput, setSearchInput] = useState('');
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(20);
  const [totalCustomers, setTotalCustomers] = useState(0);
  const [totalAllCustomers, setTotalAllCustomers] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [nextPageToken, setNextPageToken] = useState(null);

  // Fetch customers from the API
  const fetchCustomers = useCallback(async (nameFilter = '', pageToken = null) => {
    setLoading(true);
    try {
      let url = `${API_URL}/user/admin/users`;
      const params = new URLSearchParams();
      
      if (nameFilter) {
        params.append('name_filter', nameFilter);
      }
      
      if (pageToken) {
        params.append('page_token', pageToken);
      }

      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      const response = await fetchWithAdminAuth(url, {
        method: 'GET',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch customers');
      }

      const data = await response.json();
      
      setCustomers(data.customers || []);
      setCurrentPage(data.current_page || 1);
      setTotalCustomers(data.total_customers || 0);
      setTotalAllCustomers(data.total_all_customers || 0);
      setHasMore(data.has_more || false);
      setNextPageToken(data.next_page_token);

    } catch (error) {
      console.error('Error fetching customers:', error);
      toast.error('Failed to load customers');
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  // Handle search
  const handleSearch = () => {
    setSearchTerm(searchInput);
    setNextPageToken(null);
    fetchCustomers(searchInput);
  };

  // Handle clear search
  const handleClearSearch = () => {
    setSearchInput('');
    setSearchTerm('');
    setNextPageToken(null);
    fetchCustomers();
  };

  // Handle pagination - next page
  const handleNextPage = () => {
    if (hasMore && nextPageToken) {
      fetchCustomers(searchTerm, nextPageToken);
    }
  };

  // Handle pagination - previous page
  const handlePreviousPage = () => {
    // Note: The API doesn't provide a previous page token
    // We'll need to implement this differently or request backend support
    toast.info('Previous page functionality requires backend support');
  };

  // Format date
  const formatDate = (dateString) => {
    try {
      return format(new Date(dateString), 'MMM dd, yyyy HH:mm');
    } catch (error) {
      return dateString;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Customer Management</h1>
          <p className="text-muted-foreground mt-1">
            {searchTerm ? (
              <>Showing {totalCustomers} of {totalAllCustomers} customers matching "{searchTerm}"</>
            ) : (
              <>Total customers: {totalAllCustomers}</>
            )}
          </p>
        </div>
      </div>

      {/* Search Bar */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Search Customers
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              placeholder="Search by name..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleSearch();
                }
              }}
              className="flex-1"
            />
            <Button onClick={handleSearch} disabled={loading}>
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
              <span className="ml-2">Search</span>
            </Button>
            {searchTerm && (
              <Button onClick={handleClearSearch} variant="outline">
                Clear
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Customer Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            Customers {searchTerm && `(Filtered by "${searchTerm}")`}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading && customers.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-2 text-muted-foreground">Loading customers...</span>
            </div>
          ) : customers.length === 0 ? (
            <div className="text-center py-12">
              <User className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                {searchTerm ? 'No customers found matching your search' : 'No customers found'}
              </p>
            </div>
          ) : (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Customer</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead className="text-center">Orders</TableHead>
                      <TableHead className="text-right">Total Spent</TableHead>
                      <TableHead className="text-center">Roles</TableHead>
                      <TableHead>Joined</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {customers.map((customer) => (
                      <TableRow key={customer.customer_id}>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium">{customer.full_name}</span>
                            <span className="text-sm text-muted-foreground">
                              ID: {customer.customer_id.slice(0, 8)}...
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2 text-sm">
                              <Mail className="h-3 w-3 text-muted-foreground" />
                              {customer.email}
                            </div>
                            {customer.phone && (
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Phone className="h-3 w-3" />
                                {customer.phone}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-muted-foreground" />
                            {customer.city || 'N/A'}
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline">
                            {customer.total_orders}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {customer.total_spent > 0 ? (
                            <span className="text-green-600">
                              {formatDualCurrencyCompact(customer.total_spent)}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">
                              {formatDualCurrencyCompact(0)}
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1 justify-center">
                            {customer.is_admin && (
                              <Badge variant="destructive" className="text-xs">
                                Admin
                              </Badge>
                            )}
                            {customer.is_worker && (
                              <Badge variant="secondary" className="text-xs">
                                Worker
                              </Badge>
                            )}
                            {!customer.is_admin && !customer.is_worker && (
                              <Badge variant="outline" className="text-xs">
                                Customer
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            {formatDate(customer.created_at)}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination Controls */}
              <div className="flex items-center justify-between mt-4 pt-4 border-t">
                <div className="text-sm text-muted-foreground">
                  Page {currentPage} • Showing {customers.length} of {totalCustomers} customers
                  {searchTerm && ` (${totalAllCustomers} total)`}
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={handlePreviousPage}
                    disabled={currentPage === 1 || loading}
                    variant="outline"
                    size="sm"
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Previous
                  </Button>
                  <Button
                    onClick={handleNextPage}
                    disabled={!hasMore || loading}
                    variant="outline"
                    size="sm"
                  >
                    Next
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
