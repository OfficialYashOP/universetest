import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Phone, Building2, ArrowLeft, Search } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

interface HostelContact {
  id: string;
  hostel_name: string;
  block: string | null;
  landline: string | null;
  mobile: string | null;
  availability: string | null;
  hostel_type: string;
}

const LPUHostels = () => {
  const [contacts, setContacts] = useState<HostelContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [hostelType, setHostelType] = useState<string>("all");

  useEffect(() => {
    fetchContacts();
  }, []);

  const fetchContacts = async () => {
    const { data, error } = await supabase
      .from("lpu_hostel_contacts")
      .select("*")
      .order("hostel_name");
    
    if (data) setContacts(data);
    setLoading(false);
  };

  const handleCall = (number: string) => {
    window.location.href = `tel:${number.replace(/-/g, '')}`;
  };

  const filteredContacts = contacts.filter((contact) => {
    const matchesSearch = 
      contact.hostel_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (contact.block && contact.block.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesType = hostelType === "all" || contact.hostel_type === hostelType;
    
    return matchesSearch && matchesType;
  });

  const boysHostels = filteredContacts.filter(c => c.hostel_type === 'boys');
  const girlsHostels = filteredContacts.filter(c => c.hostel_type === 'girls');
  const apartments = filteredContacts.filter(c => c.hostel_type === 'apartment');

  const HostelCard = ({ contact }: { contact: HostelContact }) => (
    <Card>
      <CardContent className="p-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Building2 className={`w-4 h-4 ${
                contact.hostel_type === 'boys' ? 'text-blue-500' : 
                contact.hostel_type === 'girls' ? 'text-pink-500' : 'text-purple-500'
              }`} />
              <span className="font-semibold">{contact.hostel_name}</span>
              {contact.block && (
                <span className="text-sm bg-muted px-2 py-0.5 rounded">
                  Block {contact.block}
                </span>
              )}
            </div>
            {contact.availability && (
              <p className="text-xs text-muted-foreground mt-1">
                ⏰ {contact.availability}
              </p>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {contact.landline && (
              <Button size="sm" variant="outline" onClick={() => handleCall(contact.landline!)}>
                <Phone className="w-4 h-4 mr-1" />
                Landline
              </Button>
            )}
            {contact.mobile && (
              <Button size="sm" onClick={() => handleCall(contact.mobile!)}>
                <Phone className="w-4 h-4 mr-1" />
                Emergency
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <DashboardLayout>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link to="/lpu">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Hostel Quick Dial</h1>
            <p className="text-muted-foreground">Find your hostel contact instantly</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search hostel or block..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={hostelType} onValueChange={setHostelType}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Hostels</SelectItem>
              <SelectItem value="boys">Boys (BH)</SelectItem>
              <SelectItem value="girls">Girls (GH)</SelectItem>
              <SelectItem value="apartment">Apartment</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Boys Hostels */}
        {(hostelType === "all" || hostelType === "boys") && boysHostels.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Building2 className="w-5 h-5 text-blue-500" />
              Boys Hostels
            </h2>
            {boysHostels.map((contact) => (
              <HostelCard key={contact.id} contact={contact} />
            ))}
          </div>
        )}

        {/* Girls Hostels */}
        {(hostelType === "all" || hostelType === "girls") && girlsHostels.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Building2 className="w-5 h-5 text-pink-500" />
              Girls Hostels
            </h2>
            {girlsHostels.map((contact) => (
              <HostelCard key={contact.id} contact={contact} />
            ))}
          </div>
        )}

        {/* Apartments */}
        {(hostelType === "all" || hostelType === "apartment") && apartments.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Building2 className="w-5 h-5 text-purple-500" />
              Apartments
            </h2>
            {apartments.map((contact) => (
              <HostelCard key={contact.id} contact={contact} />
            ))}
          </div>
        )}

        {filteredContacts.length === 0 && !loading && (
          <div className="text-center py-12 text-muted-foreground">
            No hostels found matching your search.
          </div>
        )}

        {/* Disclaimer */}
        <p className="text-xs text-muted-foreground text-center px-4 pb-4">
          ⚠️ Landlines available 8:00 AM to 10:00 PM. Use emergency mobile after hours.
        </p>
      </div>
    </DashboardLayout>
  );
};

export default LPUHostels;
