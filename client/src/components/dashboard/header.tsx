import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Upload, Menu, User as UserIcon } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { CsvUploadModal } from "./csv-upload-modal";

type HeaderProps = {
  title: string;
  onMenuClick?: () => void;
};

export function Header({ title, onMenuClick }: HeaderProps) {
  const { user, logoutMutation } = useAuth();
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  return (
    <>
      <header className="bg-white shadow-sm z-10">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <button
                className="md:hidden p-2 rounded-md text-neutral-500 hover:text-neutral-700 focus:outline-none"
                onClick={onMenuClick}
              >
                <Menu className="h-5 w-5" />
              </button>
              <h1 className="ml-2 md:ml-0 text-lg font-medium text-neutral-800">
                {title}
              </h1>
            </div>

            <div className="flex items-center gap-4">
              <Button
                size="sm"
                onClick={() => setIsUploadModalOpen(true)}
                className="hidden sm:flex items-center"
              >
                <Upload className="mr-2 h-4 w-4" />
                Upload CSV
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="p-1 rounded-full h-8 w-8 md:hidden"
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-primary-200 text-primary-700">
                        {user?.firstName?.[0]}
                        {user?.lastName?.[0]}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>My Account</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setIsUploadModalOpen(true)}>
                    <Upload className="mr-2 h-4 w-4" />
                    Upload CSV
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => logoutMutation.mutate()}
                    disabled={logoutMutation.isPending}
                  >
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>

      <CsvUploadModal 
        isOpen={isUploadModalOpen} 
        onClose={() => setIsUploadModalOpen(false)} 
      />
    </>
  );
}
