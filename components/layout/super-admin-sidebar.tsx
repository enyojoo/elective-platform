"use client"
import {
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerHeader,
  DrawerOverlay,
  Flex,
  Icon,
  Link,
  Text,
  useDisclosure,
} from "@chakra-ui/react"
import { FiHome, FiTrendingUp, FiCompass, FiStar, FiSettings } from "react-icons/fi"
import { useRouter } from "next/router"

interface NavItemProps {
  icon: any
  title: string
  active: boolean
  navSize: string
  href: string
}

const NavItem = ({ icon, title, active, navSize, href }: NavItemProps) => {
  const router = useRouter()

  const handleClick = () => {
    router.push(href)
  }

  return (
    <Flex
      align="center"
      p="4"
      mx="4"
      borderRadius="lg"
      role="group"
      cursor="pointer"
      bg={active ? "gray.100" : ""}
      color={active ? "blue.500" : "gray.400"}
      _hover={{
        bg: "gray.100",
        color: "blue.500",
      }}
      onClick={handleClick}
    >
      <Icon mr="2" fontSize="20" as={icon} />
      {navSize === "large" && <Text>{title}</Text>}
    </Flex>
  )
}

interface SidebarProps {
  navSize: string
}

const Sidebar = ({ navSize }: SidebarProps) => {
  const { isOpen, onOpen, onClose } = useDisclosure()
  const router = useRouter()

  const currentRoute = router.pathname

  return (
    <>
      <Drawer placement="left" onClose={onClose} isOpen={isOpen}>
        <DrawerOverlay />
        <DrawerContent>
          <DrawerHeader borderBottomWidth="1px">Placeholder Logo</DrawerHeader>
          <DrawerBody>
            <Flex direction="column" align="center" w="100%">
              <NavItem navSize={navSize} icon={FiHome} title="Dashboard" active={currentRoute === "/"} href="/" />
              <NavItem
                navSize={navSize}
                icon={FiTrendingUp}
                title="Trending"
                active={currentRoute === "/trending"}
                href="/trending"
              />
              <NavItem
                navSize={navSize}
                icon={FiCompass}
                title="Explore"
                active={currentRoute === "/explore"}
                href="/explore"
              />
              <NavItem
                navSize={navSize}
                icon={FiStar}
                title="Favorites"
                active={currentRoute === "/favorites"}
                href="/favorites"
              />
              <NavItem
                navSize={navSize}
                icon={FiSettings}
                title="Settings"
                active={currentRoute === "/settings"}
                href="/settings"
              />
            </Flex>
          </DrawerBody>
        </DrawerContent>
      </Drawer>
      <Flex
        pos="sticky"
        left="5"
        h="100vh"
        marginTop="2.5vh"
        boxShadow="0 4px 12px 0 rgba(0, 0, 0, 0.05)"
        borderRadius="lg"
        w={navSize == "small" ? "75px" : "200px"}
        flexDir="column"
        justifyContent="space-between"
      >
        <Flex p="5%" flexDir="column" w="100%" alignItems={navSize == "small" ? "center" : "flex-start"} as="nav">
          <Link
            _focus={{ boxShadow: "none" }}
            w="100%"
            borderRadius="lg"
            p="4"
            _hover={{ textDecor: "none", backgroundColor: "#AEC8CA" }}
            display={navSize == "small" ? "none" : "flex"}
          >
            Placeholder Logo
          </Link>
          <NavItem navSize={navSize} icon={FiHome} title="Dashboard" active={currentRoute === "/"} href="/" />
          <NavItem
            navSize={navSize}
            icon={FiTrendingUp}
            title="Trending"
            active={currentRoute === "/trending"}
            href="/trending"
          />
          <NavItem
            navSize={navSize}
            icon={FiCompass}
            title="Explore"
            active={currentRoute === "/explore"}
            href="/explore"
          />
          <NavItem
            navSize={navSize}
            icon={FiStar}
            title="Favorites"
            active={currentRoute === "/favorites"}
            href="/favorites"
          />
          <NavItem
            navSize={navSize}
            icon={FiSettings}
            title="Settings"
            active={currentRoute === "/settings"}
            href="/settings"
          />
        </Flex>

        <Flex p="5%" flexDir="column" w="100%" alignItems={navSize == "small" ? "center" : "flex-start"} mb={4}>
          <Flex align="center" bg="gray.100" p="3" borderRadius="lg" cursor="pointer">
            <Icon mr="2" fontSize="20" as={FiSettings} />
            {navSize === "large" && <Text>Settings</Text>}
          </Flex>
        </Flex>
      </Flex>
    </>
  )
}

export default Sidebar
